Smart Crutch Dashboard
A real-time monitoring dashboard for the Smart Crutch project, displaying weight-bearing status, step count, distance, and gait asymmetry data from Arduino Cloud.

📋 Prerequisites
Before you begin, ensure you have the following installed:

Node.js (version 14 or higher) - Download here
npm (comes with Node.js)
To check if you have them installed, run:

bash
node --version
npm --version
🚀 Installation & Setup
Step 1: Create Project Folder
Create a new folder for your project and navigate to it:

bash
mkdir smart-crutch-dashboard
cd smart-crutch-dashboard
Step 2: Create Required Files
Create the following folder structure:

smart-crutch-dashboard/
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   ├── App.css
│   └── index.js
├── package.json
├── .gitignore
└── README.md
Step 3: Copy File Contents
Copy the contents from each artifact into the corresponding files:

package.json - Copy from the "package.json" artifact
src/App.js - Copy from the "src/App.js" artifact
src/App.css - Copy from the "src/App.css" artifact
src/index.js - Copy from the "src/index.js" artifact
public/index.html - Copy from the "public/index.html" artifact
.gitignore - Copy from the ".gitignore" artifact
Step 4: Install Dependencies
Open your terminal in the project folder and run:

bash
npm install
This will install all required packages:

React
React-DOM
Recharts (for charts)
Lucide-react (for icons)
Step 5: Run the App
Start the development server:

bash
npm start
The app will automatically open in your browser at http://localhost:3000

If it doesn't open automatically, manually navigate to http://localhost:3000

🎯 Using the Dashboard
Initial Setup
When you first open the app, you'll see the "Smart Crutch Setup" page
Enter any credentials (for testing, you can use "demo" / "demo")
Click "Connect to Arduino Cloud"
The app will enter simulation mode and start displaying data
Dashboard Features
1. Weight Bearing Dashboard
Real-time force readings from left and right crutches
Weight bearing classification (NWB, TDWB, PWB, WBAT, FWB)
Percentage of body weight calculation
Force distribution chart over time
2. Steps & Distance Dashboard
Daily step count with goal tracking
Distance walked in kilometers
Progress bar showing completion percentage
Activity trend visualization
3. Gait Asymmetry Dashboard
IMU readings from both crutches (X, Y, Z axes)
Asymmetry score calculation
Gait analysis feedback
Asymmetry trend chart
🔌 Connecting to Real Arduino Cloud Data
Currently, the app uses simulated data. To connect to real Arduino Cloud:

Get your Arduino Cloud API credentials from https://cloud.arduino.cc
Create the following variables in your Arduino Cloud Thing:
leftForce (float)
rightForce (float)
stepCount (int)
distance (float)
leftAccelX, leftAccelY, leftAccelZ (float)
rightAccelX, rightAccelY, rightAccelZ (float)
Replace the startDataSimulation() function in src/App.js with actual Arduino Cloud API calls
📦 Building for Production
To create a production build:

bash
npm run build
This creates an optimized build in the build/ folder that you can deploy to any web server.

🛠️ Troubleshooting
Port 3000 is already in use
If you see this error, either:

Stop the process using port 3000
Run npm start and choose 'Y' to run on a different port
npm install fails
Try:

bash
npm cache clean --force
npm install
Module not found errors
Make sure all files are in the correct folders and run:

bash
npm install
📝 Project Structure
smart-crutch-dashboard/
├── public/              # Static files
│   └── index.html      # HTML template
├── src/                # Source files
│   ├── App.js         # Main application component
│   ├── App.css        # Styling
│   └── index.js       # Entry point
├── package.json        # Dependencies and scripts
└── README.md          # This file
🎨 Customization
Changing User Profile
Edit the userProfile state in src/App.js:

javascript
const [userProfile] = useState({
  weight: 70,    // kg
  height: 170,   // cm
  targetLoad: 25 // percentage
});
Adjusting Update Frequency
Change the interval in startDataSimulation():

javascript
setInterval(() => {
  // ...
}, 2000); // Change 2000 to desired milliseconds
📄 License
This project is part of the Smart Crutch Team 9 initiative.

👥 Team
Divya
Noa
Abhi
For questions or issues, please contact the development team.
