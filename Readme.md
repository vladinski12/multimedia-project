# 📊 EU Indicators Visualization App

An interactive web application for visualizing key socio-economic indicators—GDP per capita, life expectancy, and population—across European Union countries from 2000 to 2018.

## 🧩 Features

* **Automatic Data Loading**: On startup, the app fetches the latest available data for EU countries covering the last 15 years.
* **Interactive Charts**: Select a country and an indicator (GDP per capita, life expectancy, or population) to view its evolution over time.
* **SVG-Based Graphs**: Data is displayed using scalable vector graphics for clarity and responsiveness.
* **Tooltips**: Hover over data points to see detailed information, including the specific year and value.
* **Responsive Design**: Works seamlessly across different screen sizes and devices.
* **Real-time Data Visualization**: Dynamic chart updates based on user selections.

## 🛠️ Technologies Used

* **HTML5** - Structure and semantic markup
* **CSS3** - Styling, layout, and responsive design
* **JavaScript (Vanilla)** - Interactive functionality and data manipulation
* **SVG** - Scalable vector graphics for data visualization

## 📁 Project Structure

```
multimedia-project/
├── 3_1094_PIRVAN_Vlad-Alexandru.html    # Main HTML file
├── 3_1094_PIRVAN_Vlad-Alexandru.css     # Stylesheet for layout and design
├── 3_1094_PIRVAN_Vlad-Alexandru.js      # JavaScript logic for data handling and interactivity
├── media/                               # Directory containing media assets
├── README.md                            # Project documentation
└── ...
```

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for data fetching

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vladinski12/multimedia-project.git
   ```

2. **Navigate to the project directory**:
   ```bash
   cd multimedia-project
   ```

3. **Open the HTML file in your browser**:
   ```bash
   # On Linux/macOS
   open 3_1094_PIRVAN_Vlad-Alexandru.html
   
   # On Windows
   start 3_1094_PIRVAN_Vlad-Alexandru.html
   ```

   Alternatively, you can double-click the HTML file to open it in your default browser.

### Usage

1. Open the application in your web browser
2. Wait for the data to load automatically
3. Select a country from the dropdown menu
4. Choose an indicator (GDP per capita, life expectancy, or population)
5. View the interactive chart showing data trends over time
6. Hover over data points to see detailed tooltips

## 📊 Data Source

The application utilizes publicly available datasets detailing GDP per capita, life expectancy, and population statistics for EU countries from 2000 to 2018. Data is fetched dynamically to ensure up-to-date information.

## 🔧 Key Features Implementation

- **Data Visualization**: Custom SVG-based charts with smooth animations
- **Interactive Elements**: Dropdown selectors and hover effects
- **Responsive Layout**: Flexible design that adapts to different screen sizes
- **Performance Optimized**: Efficient data loading and rendering
