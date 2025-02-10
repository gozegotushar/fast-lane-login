require 'spaceship'
require 'json'

email = ENV['FASTLANE_USER']
password = ENV['FASTLANE_PASSWORD']

Spaceship::ConnectAPI.login(ENV['FASTLANE_USER'])
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