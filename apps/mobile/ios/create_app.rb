require 'fastlane'
require 'spaceship'

key_id = "5JQ922VJHD"
issuer_id = "35f52721-fd60-4398-a70f-13a4ae870a55"
key_filepath = "/Users/rag/Documents/workspace/cabal-app/fastlane/AuthKey_5JQ922VJHD.p8"

puts "1. Creating App Store Connect API Token..."
token = Spaceship::ConnectAPI::Token.create(
  key_id: key_id,
  issuer_id: issuer_id,
  filepath: key_filepath
)

Spaceship::ConnectAPI.token = token

bundle_id = "com.copytrading.app"
app_name = "CopyTrading"
sku = "copytrading_app_" + Time.now.to_i.to_s

puts "2. Registering Bundle ID #{bundle_id}..."
begin
  b_id = Spaceship::ConnectAPI::BundleId.find(bundle_id: bundle_id)
  if b_id
    puts "Found existing bundle ID: #{b_id.id}"
  else
    b_id = Spaceship::ConnectAPI::BundleId.create(
      name: app_name,
      platform: "IOS",
      identifier: bundle_id
    )
    puts "Created Bundle ID: #{b_id.id}"
  end
rescue => e
  puts "Bundle ID check/create result: #{e.message}"
end

puts "3. Creating App Record in App Store Connect for #{app_name}..."
begin
  app = Spaceship::ConnectAPI::App.find(bundle_id)
  if app
    puts "Found existing App Record: #{app.id} - #{app.name}"
  else
    app = Spaceship::ConnectAPI::App.create(
      name: app_name,
      bundle_id: bundle_id,
      sku: sku,
      primary_locale: "en-US"
    )
    puts "Successfully created App Record! App ID: #{app.id}"
  end
rescue => e
  puts "App creation failed: #{e.message}"
  puts e.backtrace
end
