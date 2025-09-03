#!/usr/bin/env ruby
# frozen_string_literal: true

require "json"
require "uri"
require "net/http"
require "openssl"

# ==========
# CONFIG
# ==========
MB_URL         = "http://localhost:3000/"
API_KEY        = "mb_txfwmBH+mWV0YDrmyNO/Odk7V5HIw+2oDThXAJluzuk="
DATABASE_ID    = "2"
COLLECTION_ID  = "5"

# Generate random number for unique question names
RANDOM_ID = rand(1000..9999)

QUESTION_NAME        = "[FROM LOCAL] Orders quantity by name (SQL) - #{RANDOM_ID}"
QUESTION_DESCRIPTION = "[FROM LOCAL] Summed amounts grouped by name (created via API) - #{RANDOM_ID}"
QUESTION_DISPLAY     = "table"

SQL_QUERY = <<~SQL
  -- WE CAN INTERPOLATE THE ORG_ID HERE WHEN
  SELECT
    name,
    SUM(amount) AS quantity
  FROM orders
  GROUP BY orders.name;
SQL

# ==========
# HTTP helpers
# ==========
def http_client
  uri = URI.parse(MB_URL)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = (uri.scheme == "https")
  http.verify_mode = OpenSSL::SSL::VERIFY_PEER if http.use_ssl?
  http
end

def build_uri(path)
  base = URI.parse(MB_URL)
  base.path = (base.path.chomp("/") + path)
  base
end

def request_json(method:, path:, body: nil)
  uri = build_uri(path)
  req = case method
        when :get    then Net::HTTP::Get.new(uri)
        when :post   then Net::HTTP::Post.new(uri)
        when :put    then Net::HTTP::Put.new(uri)
        when :delete then Net::HTTP::Delete.new(uri)
        else
          raise "Unsupported method #{method}"
        end
  req["Content-Type"] = "application/json"
  req["X-API-KEY"]    = API_KEY
  req.body = JSON.dump(body) if body

  res = http_client.request(req)
  unless res.is_a?(Net::HTTPSuccess)
    abort "HTTP #{res.code} #{res.message} for #{path}\nBody: #{res.body}"
  end
  JSON.parse(res.body) rescue {}
end

# ==========
# Discover IDs if needed
# ==========
def pick_database_id
  return Integer(DATABASE_ID) if DATABASE_ID && (DATABASE_ID.is_a?(Integer) || !DATABASE_ID.to_s.empty?)

  dbs = request_json(method: :get, path: "/api/database")
  candidates = dbs.is_a?(Array) ? dbs : dbs.fetch("data", []) # some versions return {data: [...]}

  abort "No databases found in Metabase." if candidates.nil? || candidates.empty?

  # Prefer a non-sample DB if present
  chosen = candidates.find { |d| !d["is_sample"] } || candidates.first
  puts "Picked database: #{chosen["name"]} (id=#{chosen["id"]})"
  chosen["id"]
end

def collection_id_or_nil
  return nil if COLLECTION_ID.nil? || COLLECTION_ID.strip.empty?
  Integer(COLLECTION_ID)
end

# ==========
# Create Question
# ==========
def create_question(db_id, col_id)
  payload = {
    "name"                   => QUESTION_NAME,
    "description"            => QUESTION_DESCRIPTION,
    "collection_id"          => col_id, # nil is fine
    "display"                => QUESTION_DISPLAY,
    "visualization_settings" => {},
    "dataset_query"          => {
      "type"     => "native",
      "database" => db_id,
      "native"   => {
        "query"          => SQL_QUERY,
        "template-tags"  => {}
      }
    }
  }

  request_json(method: :post, path: "/api/card", body: payload)
end

# ==========
# Main
# ==========
db_id = pick_database_id
col_id = collection_id_or_nil
card  = create_question(db_id, col_id)

card_id = card["id"] || card.dig("data", "id")
abort "Unexpected response creating card: #{card.inspect}" unless card_id

# Try to print a friendly URL to the question in the UI
begin
  base = URI.parse(MB_URL)
  base.path = (base.path.chomp("/") + "/question/#{card_id}")
  question_url = base.to_s
rescue
  question_url = "(open your Metabase UI → Question ##{card_id})"
end

puts "✅ Created Question ##{card_id}: #{QUESTION_NAME}"
puts "   URL: #{question_url}"
puts "   Collection: #{col_id.nil? ? 'Default (My personal collection)' : col_id}"

# ==========
# Publish for Embedding
# ==========
def publish_for_embedding(card_id)
  payload = {
    "enable_embedding" => true,
    "embedding_params" => {}
  }

  request_json(method: :put, path: "/api/card/#{card_id}", body: payload)
end

# Publish the question for embedding
begin
  publish_result = publish_for_embedding(card_id)
  puts "✅ Published Question ##{card_id} for embedding"
rescue => e
  puts "❌ Failed to publish question for embedding: #{e.message}"
  exit 1
end

puts "\n📋 Summary:"
puts "   Card ID: #{card_id}"
puts "   Question: #{QUESTION_NAME}"
puts "   Status: Published and ready for embedding"
