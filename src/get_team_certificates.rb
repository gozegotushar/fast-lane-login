require 'spaceship'
require 'json'

# Authenticate with Apple ID (uses Fastlane session if available)
Spaceship::ConnectAPI.login(ENV['FASTLANE_USER'])

# # ✅ Fetch all certificates
# certificates = Spaceship::Portal.certificate.all

# # ✅ Create a directory to store certificates
# Dir.mkdir("certificates") unless Dir.exist?("certificates")

# # ✅ Iterate through each certificate and download it
# certificates.each do |cert|
#   cert_name = "#{cert.id}_#{cert.name}.cer"  # Unique filename
#   cert_path = File.join("certificates", cert_name)

#   File.write(cert_path, cert.download_raw)
  
#   puts "✅ Downloaded: #{cert_name}"
# end
certs = Spaceship::Portal.certificate.all

certs_json = certs.map do |cert|
  {
    name: cert.name,
    # type: cert.type,
    id: cert.id,
    expires: cert.expires, # Expiration date
    created: cert.created, # Creation date
    status: cert.status,   # Active, Expired, etc.
    owner_name: cert.owner_name, # Owner of the certificate
    can_download: cert.can_download, # Owner of the certificate
    # platform: cert.platform # iOS, macOS, etc.
  }
end

puts JSON.pretty_generate(certs_json)