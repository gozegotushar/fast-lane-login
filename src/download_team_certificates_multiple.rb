require 'spaceship'
require 'json'

email = ENV['FASTLANE_USER']
password = ENV['FASTLANE_PASSWORD']

begin
  # ✅ Ensure FASTLANE_SESSION is available
  session = ENV['FASTLANE_SESSION']
  if session.nil? || session.strip.empty?
    puts JSON.generate({ success: false, error: "FASTLANE_SESSION is missing!" })
    exit 1
  end

  # ✅ Login using session
  Spaceship::Portal.login(email, password) 
  Spaceship::Portal.client.team_id = ENV['FASTLANE_TEAM_ID'] if ENV['FASTLANE_TEAM_ID']

  # ✅ Fetch all certificates
  certificates = Spaceship::Portal.certificate.all

  # ✅ Create a directory to store certificates
  dir_name = "certificates"
  Dir.mkdir(dir_name) unless Dir.exist?(dir_name)

  # ✅ Store downloaded certificate names
  downloaded_certs = []

  # ✅ Iterate through each certificate and download it
  certificates.each do |cert|
    cert_name = "#{cert.id}_#{cert.name.gsub(/\s+/, '_')}.cer" # Avoid spaces in filename
    cert_path = File.join(dir_name, cert_name)

    # ✅ Save certificate file
    File.write(cert_path, cert.download_raw)
    
    # ✅ Add to list
    downloaded_certs << cert_name
  end

  # ✅ Print JSON response
  puts JSON.generate({ success: true, certificates: downloaded_certs })

rescue StandardError => e
  puts JSON.generate({ success: false, error: e.message })
  exit 1
end