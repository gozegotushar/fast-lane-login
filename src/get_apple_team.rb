require 'spaceship'
require 'json'

begin
  # ✅ Authenticate with Apple ID (Uses Fastlane session if available)
  Spaceship::ConnectAPI.login(ENV['FASTLANE_USER'])

  # ✅ Fetch teams
  teams = Spaceship::Portal.client.teams

  # ✅ Convert teams to JSON format
  teams_json = teams.map(&:to_json)

  # ✅ Print JSON response
  puts JSON.pretty_generate({ success: true, teams: teams_json })

rescue StandardError => e
  puts JSON.generate({ success: false, error: e.message })
  exit 1
end