import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Card,
  CardContent
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Transactions = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [stats, setStats] = useState(null);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch all transactions
        const response = await axios.get('/api/tokens/transactions');
        const sortedTransactions = response.data.data.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        setTransactions(sortedTransactions);
        setFilteredTransactions(sortedTransactions);
        setTotalPages(Math.ceil(sortedTransactions.length / rowsPerPage));
        
        // Fetch transaction stats
        const statsResponse = await axios.get('/api/tokens/stats');
        setStats(statsResponse.data.data);
        
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transactions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchTransactions();
    }
  }, [currentUser]);

  useEffect(() => {
    // Filter transactions based on search term and type filter
    let filtered = [...transactions];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    setFilteredTransactions(filtered);
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
    setPage(1); // Reset to first page when filters change
  }, [searchTerm, typeFilter, sortOrder, transactions]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'reward':
        return 'success';
      case 'transfer':
        return 'primary';
      case 'stake':
        return 'secondary';
      case 'unstake':
        return 'info';
      case 'redeem':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Prepare chart data for transaction types
  const prepareTransactionTypesData = () => {
    if (!transactions || transactions.length === 0) {
      return null;
    }
    
    const typeCount = transactions.reduce((acc, transaction) => {
      acc[transaction.type] = (acc[transaction.type] || 0) + 1;
      return acc;
    }, {});
    
    return {
      labels: Object.keys(typeCount).map(type => type.charAt(0).toUpperCase() + type.slice(1)),
      datasets: [
        {
          data: Object.values(typeCount),
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare chart data for transaction history
  const prepareTransactionHistoryData = () => {
    if (!transactions || transactions.length === 0) {
      return null;
    }
    
    // Group transactions by month
    const monthlyData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.createdAt);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = {
          rewards: 0,
          transfers: 0,
          stakes: 0,
          unstakes: 0,
          redeems: 0
        };
      }
      
      if (transaction.type === 'reward') {
        acc[monthYear].rewards += transaction.amount;
      } else if (transaction.type === 'transfer') {
        acc[monthYear].transfers += transaction.amount;
      } else if (transaction.type === 'stake') {
        acc[monthYear].stakes += transaction.amount;
      } else if (transaction.type === 'unstake') {
        acc[monthYear].unstakes += transaction.amount;
      } else if (transaction.type === 'redeem') {
        acc[monthYear].redeems += transaction.amount;
      }
      
      return acc;
    }, {});
    
    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const [aMonth, aYear] = a.split('/').map(Number);
      const [bMonth, bYear] = b.split('/').map(Number);
      return aYear !== bYear ? aYear - bYear : aMonth - bMonth;
    });
    
    return {
      labels: sortedMonths,
      datasets: [
        {
          label: 'Rewards',
          data: sortedMonths.map(month => monthlyData[month].rewards),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Transfers',
          data: sortedMonths.map(month => monthlyData[month].transfers),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Stakes',
          data: sortedMonths.map(month => monthlyData[month].stakes),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
        {
          label: 'Unstakes',
          data: sortedMonths.map(month => monthlyData[month].unstakes),
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1,
        },
        {
          label: 'Redeems',
          data: sortedMonths.map(month => monthlyData[month].redeems),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Get paginated transactions
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Transactions
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Tokens Earned
              </Typography>
              <Typography variant="h3">
                {stats?.totalEarned || 0}
              </Typography>
              <Typography variant="body2">
                Lifetime earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Tokens Spent
              </Typography>
              <Typography variant="h3">
                {stats?.totalSpent || 0}
              </Typography>
              <Typography variant="body2">
                Transfers, stakes, and redemptions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Balance
              </Typography>
              <Typography variant="h3">
                {stats?.currentBalance || 0}
              </Typography>
              <Typography variant="body2">
                Available tokens
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Transaction Types Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Transaction Types
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {prepareTransactionTypesData() ? (
              <Box className="chart-container">
                <Doughnut 
                  data={prepareTransactionTypesData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                    },
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body1" color="text.secondary">
                  No transaction data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Transaction History Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Transaction History
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {prepareTransactionHistoryData() ? (
              <Box className="chart-container">
                <Bar 
                  data={prepareTransactionHistoryData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        stacked: true,
                      },
                      y: {
                        stacked: true,
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body1" color="text.secondary">
                  No transaction history available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Transactions List */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Transaction History
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  placeholder="Search transactions..."
                  size="small"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="type-filter-label">Type</InputLabel>
                  <Select
                    labelId="type-filter-label"
                    value={typeFilter}
                    label="Type"
                    onChange={handleTypeFilterChange}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="reward">Rewards</MenuItem>
                    <MenuItem value="transfer">Transfers</MenuItem>
                    <MenuItem value="stake">Stakes</MenuItem>
                    <MenuItem value="unstake">Unstakes</MenuItem>
                    <MenuItem value="redeem">Redemptions</MenuItem>
                  </Select>
                </FormControl>
                <IconButton onClick={toggleSortOrder} color="primary">
                  <SortIcon />
                </IconButton>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {filteredTransactions.length > 0 ? (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedTransactions.map((transaction) => (
                        <TableRow key={transaction._id} hover>
                          <TableCell>
                            {new Date(transaction.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} 
                              color={getTransactionTypeColor(transaction.type)} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color={transaction.type === 'redeem' || (transaction.type === 'transfer' && transaction.from?._id === currentUser._id) ? 'error.main' : 'success.main'}
                              sx={{ fontWeight: 'bold' }}
                            >
                              {transaction.type === 'redeem' || (transaction.type === 'transfer' && transaction.from?._id === currentUser._id) ? '-' : '+'}{transaction.amount}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={transaction.status} 
                              color={getStatusChipColor(transaction.status)} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            {transaction.reason || 
                              (transaction.type === 'reward' && 'Performance reward') ||
                              (transaction.type === 'transfer' && transaction.from?._id === currentUser._id && `Transfer to ${transaction.to?.name || 'Unknown'}`) ||
                              (transaction.type === 'transfer' && transaction.to?._id === currentUser._id && `Transfer from ${transaction.from?.name || 'Unknown'}`) ||
                              (transaction.type === 'stake' && 'Staking tokens') ||
                              (transaction.type === 'unstake' && 'Unstaking tokens') ||
                              (transaction.type === 'redeem' && `Redemption: ${transaction.redeemOption || 'Unknown'}`) ||
                              'Transaction'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination 
                    count={totalPages} 
                    page={page} 
                    onChange={handlePageChange} 
                    color="primary" 
                  />
                </Box>
              </>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No transactions found matching your criteria.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Transactions;
