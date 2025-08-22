# tanaoroshi Project

## Overview
The tanaoroshi project is a web application that interacts with the kintone API. It allows users to input data into a table format, which can then be sent to kintone for storage and management.

## Project Structure
```
tanaoroshi
├── src
│   ├── public
│   │   ├── index.html       # Main HTML file for the application
│   │   ├── app.js           # Client-side JavaScript code
│   │   └── styles.css       # CSS styles for the application
│   ├── server
│   │   ├── index.js         # Entry point for the server
│   │   └── proxy.js         # Proxy for kintone API requests
│   └── lib
│       └── kintone.js       # Library for interacting with kintone API
├── package.json              # npm configuration file
├── .gitignore                # Git ignore file
└── README.md                 # Project documentation
```

## Setup Instructions
1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Install the necessary dependencies by running:
   ```
   npm install
   ```
4. Start the server by executing:
   ```
   node src/server/index.js
   ```
5. Open your browser and navigate to `http://localhost:3000` to access the application.

## Features
- Add and remove items from a table.
- Send data to kintone API for storage.
- User-friendly interface for data entry.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.