#!/usr/bin/env ruby
# Script to create a standalone App Store Connect app record for com.copytrading.app

require 'net/http'
require 'json'
require 'openssl'
require 'base64'
require 'time'

KEY_ID    = "5JQ922VJHD"
ISSUER_ID = "35f52721-fd60-4398-a70f-13a4ae870a55"
KEY_FILE  = "/Users/rag/Documents/workspace/cabal-app/fastlane/AuthKey_5JQ922VJHD.p8"

BUNDLE_ID = "com.copytrading.app"
APP_NAME  = "CopyTrading"
TEAM_ID   = "JF8U2T952N"

def generate_jwt
  private_key = OpenSSL::PKey::EC.new(File.read(KEY_FILE))
  header = Base64.urlsafe_encode64({ alg: "ES256", kid: KEY_ID, typ: "JWT" }.to_json, padding: false)
  now = Time.now.to_i
  payload = Base64.urlsafe_encode64({
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1200,
    aud: "appstoreconnect-v1"
  }.to_json, padding: false)
  signing_input = "#{header}.#{payload}"
  digest = OpenSSL::Digest::SHA256.new
  sig = private_key.sign(digest, signing_input)
  # Convert DER signature to raw R+S for JWT
  r, s = OpenSSL::ASN1.decode(sig).value.map { |v| [v.value.to_s(16).rjust(64, '0')].pack('H*') }
  signature = Base64.urlsafe_encode64(r + s, padding: false)
  "#{signing_input}.#{signature}"
end

def asc_request(method, path, body: nil, token:)
  uri = URI("https://api.appstoreconnect.apple.com#{path}")
  req = case method
  when :get then Net::HTTP::Get.new(uri)
  when :post then Net::HTTP::Post.new(uri)
  end
  req["Authorization"] = "Bearer #{token}"
  req["Content-Type"] = "application/json"
  req.body = body.to_json if body
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  http.request(req)
end

puts "1. Generating App Store Connect JWT..."
token = generate_jwt

puts "2. Checking if Bundle ID #{BUNDLE_ID} exists..."
resp = asc_request(:get, "/v1/bundleIds?filter[identifier]=#{BUNDLE_ID}&filter[platform]=IOS", token: token)
data = JSON.parse(resp.body)

bundle_id_record = data["data"]&.first
if bundle_id_record
  puts "   Bundle ID already exists: #{bundle_id_record["id"]}"
  bundle_id_resource_id = bundle_id_record["id"]
else
  puts "   Creating Bundle ID #{BUNDLE_ID}..."
  body = {
    data: {
      type: "bundleIds",
      attributes: {
        name: APP_NAME,
        identifier: BUNDLE_ID,
        platform: "IOS"
      }
    }
  }
  resp = asc_request(:post, "/v1/bundleIds", body: body, token: token)
  created = JSON.parse(resp.body)
  if resp.code == "201"
    bundle_id_resource_id = created["data"]["id"]
    puts "   Created Bundle ID: #{bundle_id_resource_id}"
  else
    puts "   Error: #{resp.code} - #{resp.body}"
    exit(1)
  end
end

puts "3. Checking if App #{BUNDLE_ID} exists in App Store Connect..."
resp = asc_request(:get, "/v1/apps?filter[bundleId]=#{BUNDLE_ID}", token: token)
data = JSON.parse(resp.body)

if data["data"]&.any?
  app = data["data"].first
  puts "   App already exists: #{app["id"]} - #{app.dig("attributes","name")}"
else
  puts "   Creating App Record for #{APP_NAME} (#{BUNDLE_ID})..."
  # App creation requires primary locale and bundle ID relationship
  body = {
    data: {
      type: "apps",
      attributes: {
        bundleId: BUNDLE_ID,
        name: APP_NAME,
        primaryLocale: "en-US",
        sku: "copytrading_standalone_v1"
      },
      relationships: {
        bundleId: {
          data: {
            type: "bundleIds",
            id: bundle_id_resource_id
          }
        }
      }
    }
  }
  resp = asc_request(:post, "/v1/apps", body: body, token: token)
  created = JSON.parse(resp.body)
  if resp.code == "201"
    puts "   ✅ App Created! ID: #{created.dig("data","id")}"
  else
    puts "   Response #{resp.code}: #{resp.body}"
    # App may already exist or needs to be created via App Store Connect UI
    # Some accounts require app creation via web UI first
    puts "\n⚠️  App creation via API failed. If error is 'ENTITY_ERROR.RELATIONSHIP.INVALID',"
    puts "   you may need to create the app manually at:"
    puts "   https://appstoreconnect.apple.com/apps → + New App"
    puts "   Name: #{APP_NAME}, Bundle ID: #{BUNDLE_ID}, Primary Language: English"
  end
end
