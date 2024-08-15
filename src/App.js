import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Typography,
  Box,
  Container,
  Grid,
  Autocomplete,
  CircularProgress,
  Card,
  CardContent,
  CardActionArea,
  Switch,
  FormControlLabel,
  ThemeProvider,
  createTheme,
  CssBaseline,
  IconButton,
} from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import gsap from "gsap";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [search, setSearch] = useState("");
  const [symbol, setSymbol] = useState("");
  const [stockData, setStockData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [newsData, setNewsData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Closing Price",
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  });

  const stockDataRef = useRef(null);
  const historicalDataRef = useRef(null);
  const newsDataRef = useRef(null);
  const containerRef = useRef(null);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#1976d2",
      },
      secondary: {
        main: "#dc004e",
      },
    },
  });

  useEffect(() => {
    if (search.length > 1) {
      searchSymbols(search);
    } else {
      setSearchResults([]);
    }
  }, [search]);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1 }
    );
  }, []);

  useEffect(() => {
    if (historicalData) {
      setChartData({
        labels: historicalData.map(([date]) => date),
        datasets: [{
          label: "Closing Price",
          data: historicalData.map(([, data]) => data["4. close"]),
          borderColor: darkMode ? 'rgb(0, 255, 255)' : 'rgb(75, 192, 192)',
          backgroundColor: darkMode ? 'rgba(0, 255, 255, 0.2)' : 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        }],
      });
    }
  }, [darkMode, historicalData]);

  const searchSymbols = async (query) => {
    try {
      setLoading(true);
      const response = await axios.get(`https://www.alphavantage.co/query`, {
        params: {
          function: "SYMBOL_SEARCH",
          keywords: query,
          apikey: "U2TXHVQNGUWNXTWM", // Replace with your Alpha Vantage API key
        },
      });

      const results = response.data.bestMatches;
      setSearchResults(
        results.map((result) => ({
          symbol: result["1. symbol"],
          name: result["2. name"],
        }))
      );
    } catch (err) {
      console.error("Error searching symbols:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyAndStockData = async () => {
    if (!symbol) return;

    setError("");
    setStockData(null);
    setHistoricalData(null);
    setNewsData(null);
    setCompanyInfo(null);

    try {
      setLoading(true);

      // Fetch company overview
      const overviewResponse = await axios.get(
        `https://www.alphavantage.co/query`,
        {
          params: {
            function: "OVERVIEW",
            symbol: symbol,
            apikey: "U2TXHVQNGUWNXTWM", // Replace with your Alpha Vantage API key
          },
        }
      );

      if (overviewResponse.data.Symbol) {
        setCompanyInfo(overviewResponse.data);
      }

      // Fetch current stock data
      const quoteResponse = await axios.get(
        `https://www.alphavantage.co/query`,
        {
          params: {
            function: "GLOBAL_QUOTE",
            symbol: symbol,
            apikey: "U2TXHVQNGUWNXTWM", // Replace with your Alpha Vantage API key
          },
        }
      );

      const quoteData = quoteResponse.data["Global Quote"];
      if (quoteData && quoteData["01. symbol"]) {
        setStockData(quoteData);

        // Fetch historical data
        const historicalResponse = await axios.get(
          `https://www.alphavantage.co/query`,
          {
            params: {
              function: "TIME_SERIES_DAILY",
              symbol: symbol,
              apikey: "U2TXHVQNGUWNXTWM", // Replace with your Alpha Vantage API key
            },
          }
        );

        const historicalData = historicalResponse.data["Time Series (Daily)"];
        if (historicalData) {
          const chartData = Object.entries(historicalData)
            .slice(0, 30)
            .reverse();
          setHistoricalData(chartData);
        }

        // Fetch news data
        const newsResponse = await axios.get(
          `https://www.alphavantage.co/query`,
          {
            params: {
              function: "NEWS_SENTIMENT",
              tickers: symbol,
              apikey: "U2TXHVQNGUWNXTWM", // Replace with your Alpha Vantage API key
            },
          }
        );

        const newsData = newsResponse.data.feed;
        if (newsData) {
          setNewsData(newsData.slice(0, 5)); // Display top 5 news items
        }
      } else {
        setError("Stock data not found");
      }
    } catch (err) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const getChartOptions = (isDarkMode) => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000',
        },
      },
      y: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? '#ffffff' : '#000000',
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: isDarkMode ? '#ffffff' : '#000000',
        bodyColor: isDarkMode ? '#ffffff' : '#000000',
      },
    },
  });

  useEffect(() => {
    if (stockDataRef.current) {
      gsap.fromTo(
        stockDataRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1 }
      );
    }
  }, [stockData]);

  useEffect(() => {
    if (historicalDataRef.current) {
      gsap.fromTo(
        historicalDataRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1 }
      );
    }
  }, [historicalData]);

  useEffect(() => {
    if (newsDataRef.current) {
      gsap.fromTo(
        newsDataRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1 }
      );
    }
  }, [newsData]);

  const CompanyInfo = ({ info }) => (
    <Card variant="outlined" sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Company Overview
        </Typography>
        <Typography variant="body1"><strong>Name:</strong> {info.Name}</Typography>
        <Typography variant="body1"><strong>Sector:</strong> {info.Sector}</Typography>
        <Typography variant="body1"><strong>Industry:</strong> {info.Industry}</Typography>
        <Typography variant="body1"><strong>Market Cap:</strong> ${parseFloat(info.MarketCapitalization).toLocaleString()}</Typography>
        <Typography variant="body1"><strong>PE Ratio:</strong> {info.PERatio}</Typography>
        <Typography variant="body1"><strong>Dividend Yield:</strong> {info.DividendYield}%</Typography>
        <Typography variant="body1"><strong>52 Week High:</strong> ${info["52WeekHigh"]}</Typography>
        <Typography variant="body1"><strong>52 Week Low:</strong> ${info["52WeekLow"]}</Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>{info.Description}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" className="App" ref={containerRef} sx={{ py: { xs: 2, sm: 4 } }}>
        <Box sx={{ 
          display: "flex", 
          flexDirection: { xs: "column", sm: "row" }, 
          justifyContent: "space-between", 
          alignItems: { xs: "flex-start", sm: "center" }, 
          mb: 4 
        }}>
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "2rem", sm: "3rem" } }}>
            Stock-Lab
          </Typography>
          <FormControlLabel
            control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
            label="Dark Mode"
            sx={{ mt: { xs: 2, sm: 0 } }}
          />
        </Box>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 4, alignItems: "center" }}>
          <Autocomplete
            freeSolo
            options={searchResults}
            getOptionLabel={(option) => `${option.name} (${option.symbol})`}
            sx={{ width: { xs: "100%", sm: 300 } }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search company or symbol"
                variant="outlined"
                fullWidth
              />
            )}
            onInputChange={(event, newInputValue) => {
              setSearch(newInputValue);
            }}
            onChange={(event, newValue) => {
              if (newValue) {
                setSymbol(newValue.symbol);
              }
            }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={fetchCompanyAndStockData}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Get Stock Data
          </Button>
        </Box>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <CircularProgress />
          </Box>
        )}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8} lg={9}>
            <div ref={stockDataRef}>
              {companyInfo && <CompanyInfo info={companyInfo} />}
              {stockData && (
                <Card variant="outlined" sx={{ mb: 4 }}>
                  <CardContent>
                    <Typography variant="h4" component="h2" gutterBottom>
                      {stockData["01. symbol"]}
                    </Typography>
                    <Typography variant="h5" component="p">
                      Price: ${parseFloat(stockData["05. price"]).toFixed(2)}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                      <Typography variant="body1" sx={{ mr: 1 }}>
                        Change:
                      </Typography>
                      <IconButton
                        color={parseFloat(stockData["09. change"]) >= 0 ? "success" : "error"}
                        size="small"
                      >
                        {parseFloat(stockData["09. change"]) >= 0 ? <ArrowUpward /> : <ArrowDownward />}
                      </IconButton>
                      <Typography
                        variant="body1"
                        color={parseFloat(stockData["09. change"]) >= 0 ? "success.main" : "error.main"}
                      >
                        {stockData["09. change"]} ({stockData["10. change percent"]})
                      </Typography>
                    </Box>
                    <Typography variant="body1"><strong>Open:</strong> ${stockData["02. open"]}</Typography>
                    <Typography variant="body1"><strong>High:</strong> ${stockData["03. high"]}</Typography>
                    <Typography variant="body1"><strong>Low:</strong> ${stockData["04. low"]}</Typography>
                    <Typography variant="body1"><strong>Volume:</strong> {parseInt(stockData["06. volume"]).toLocaleString()}</Typography>
                    <Typography variant="body1"><strong>Latest Trading Day:</strong> {stockData["07. latest trading day"]}</Typography>
                    <Typography variant="body1"><strong>Previous Close:</strong> ${stockData["08. previous close"]}</Typography>
                  </CardContent>
                </Card>
              )}
              <div ref={historicalDataRef}>
                {historicalData && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h5" component="h3" gutterBottom>
                        30-Day Price History
                      </Typography>
                      <Box sx={{ height: { xs: 300, sm: 400 } }}>
                        <Line data={chartData} options={getChartOptions(darkMode)} />
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </Grid>
          <Grid item xs={12} md={4} lg={3}>
            <div ref={newsDataRef}>
            {newsData && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h5" component="h3" gutterBottom>
                      Related News
                    </Typography>
                    <Grid container spacing={2}>
                      {newsData.map((news, index) => (
                        <Grid item xs={12} key={index}>
                          <Card>
                            <CardActionArea
                              href={news.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <CardContent>
                                <Typography variant="body2" color="text.secondary">
                                  {news.title}
                                </Typography>
                              </CardContent>
                            </CardActionArea>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </div>
          </Grid>
        </Grid>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            © 2024 Stock Price Checker. All rights reserved.
          </Typography>
        </Box>
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Developed by- Priyanshu Sutar
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;