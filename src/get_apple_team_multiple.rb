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

  # ✅ Fetch all teams
  teams = Spaceship::Portal.client.teams || []

  if teams.empty?
    puts JSON.generate({ success: false, error: "No teams found!" })
    exit 1
  end

  # ✅ Convert to JSON
  teams_info = teams.map do |team|
    {
      "name" => team["name"],
      "teamId" => team["teamId"],
      "type" => team["type"]
    }
  end

  # ✅ Print valid JSON
  puts JSON.generate({ success: true, teams: teams_info })

rescue StandardError => e
  puts JSON.generate({ success: false, error: e.message })
  exit 1
end