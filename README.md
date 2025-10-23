# Kuwait Reinsurance Dashboard

A comprehensive business intelligence dashboard for Kuwait Reinsurance Company, built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Features

### 📊 Dashboard Pages
- **Main Dashboard** - Overview with KPIs, charts, and performance tables
- **Analytics** - Data aggregation and analysis with search functionality
- **Monthly Overview** - Monthly performance metrics and trends
- **Quarterly Overview** - Quarterly performance analysis with filtering
- **Yearly Overview** - Year-over-year trends and analysis
- **Client Overview** - Broker and cedant performance analysis
- **World Map** - Interactive geographic visualization of global operations

### 🎯 Key Capabilities
- **Interactive Data Visualization** - Charts, graphs, and maps
- **Advanced Filtering** - Multi-dimensional data filtering
- **Real-time Analytics** - Live data processing and calculations
- **Geographic Analysis** - World map with country-based policy visualization
- **Performance Metrics** - KPI calculations and trend analysis
- **Responsive Design** - Mobile-friendly interface

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Custom React components with D3.js
- **UI Components**: Custom component library
- **Data Processing**: CSV parsing and real-time aggregation
- **Maps**: D3.js with GeoJSON data

## 📁 Project Structure

```
kuwaitre-dashboard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── data/          # Main data endpoint
│   │   │   ├── dimensions/    # Filter dimensions
│   │   │   ├── monthly/       # Monthly data
│   │   │   ├── quarterly/     # Quarterly data
│   │   │   ├── yearly/        # Yearly data
│   │   │   └── world-map/     # Geographic data
│   │   ├── analytics/         # Analytics page
│   │   ├── client-overview/   # Client analysis
│   │   ├── dashboard/         # Main dashboard
│   │   ├── monthly-overview/  # Monthly analysis
│   │   ├── quarterly-overview/# Quarterly analysis
│   │   ├── world-map/         # Geographic visualization
│   │   └── yearly-overview/   # Yearly analysis
│   ├── components/            # Reusable components
│   │   ├── charts/           # Chart components
│   │   ├── kpi/              # KPI components
│   │   ├── navigation/       # Navigation components
│   │   ├── tables/           # Table components
│   │   ├── theme/            # Theme components
│   │   └── ui/               # UI components
│   └── lib/                  # Utility functions
├── public/                   # Static assets
├── Dataset_2019_2021_clean_for_code.csv  # Main data source
└── package.json             # Dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kuwaitre-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📊 Data Source

The dashboard processes data from `Dataset_2019_2021_clean_for_code.csv`, which contains:
- **3,289 records** of reinsurance data
- **103 countries** with policy coverage
- **3 years** of data (2019-2021)
- **Multiple dimensions**: Brokers, Cedants, Regions, Hubs, etc.

### Data Schema
- **Financial Metrics**: Premium, Claims, Acquisition Costs
- **Performance Ratios**: Loss Ratio, Combined Ratio, Technical Result
- **Geographic Data**: Country, Region, Hub information
- **Temporal Data**: Inception dates, quarters, months
- **Business Partners**: Brokers, Cedants, Insured entities

## 🎨 Key Features

### Interactive World Map
- **Color-coded countries** based on policy count
- **Zoom and pan** functionality
- **Hover tooltips** with detailed information
- **Geographic analysis** of global operations

### Advanced Analytics
- **Multi-dimensional filtering** by country, region, hub, broker, cedant
- **Real-time search** across aggregated data
- **Dynamic KPI calculations**
- **Trend analysis** across time periods

### Performance Metrics
- **Loss Ratio Analysis** - Claims vs Premium
- **Combined Ratio** - Total cost analysis
- **Technical Result** - Profitability metrics
- **Acquisition Cost Analysis** - Cost efficiency

## 🔧 API Endpoints

- `GET /api/data` - Main data endpoint with filtering
- `GET /api/dimensions` - Available filter options
- `GET /api/monthly` - Monthly aggregated data
- `GET /api/quarterly` - Quarterly aggregated data
- `GET /api/yearly` - Yearly aggregated data
- `GET /api/world-map` - Geographic data for mapping

## 🎯 Business Intelligence

### Dashboard Insights
- **Global Operations** - 103 countries with active policies
- **Performance Tracking** - Real-time KPI monitoring
- **Geographic Analysis** - Regional performance comparison
- **Client Analysis** - Broker and cedant performance
- **Temporal Analysis** - Monthly, quarterly, and yearly trends

### Key Metrics
- **Total Policies**: 3,289 across all years
- **Geographic Coverage**: 103 countries worldwide
- **Business Partners**: 272 brokers, 484 cedants
- **Regional Distribution**: 22 regions, 20 hubs

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
No environment variables required for basic functionality.

## 📈 Performance

- **Optimized Data Processing** - Efficient CSV parsing and caching
- **Real-time Calculations** - Dynamic KPI computation
- **Responsive Design** - Mobile and desktop optimized
- **Fast Loading** - Optimized bundle size and lazy loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software for Kuwait Reinsurance Company.

## 📞 Support

For technical support or questions, please contact the development team.

---

**Built with ❤️ for Kuwait Reinsurance Company**