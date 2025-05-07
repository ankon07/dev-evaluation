import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert,
  Pagination,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const ManageRedemptions = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [redemptions, setRedemptions] = useState([]);
  const [filteredRedemptions, setFilteredRedemptions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchRedemptions = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get('/api/redemptions');
        setRedemptions(response.data.data);
        setFilteredRedemptions(response.data.data);
        setTotalPages(Math.ceil(response.data.data.length / rowsPerPage));
      } catch (error) {
        console.error('Error fetching redemptions:', error);
        setError('Failed to load redemption requests');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser && currentUser.role === 'admin') {
      fetchRedemptions();
    }
  }, [currentUser]);

  useEffect(() => {
    // Filter redemptions based on status and type filters
    let filtered = [...redemptions];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(redemption => redemption.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(redemption => redemption.type === typeFilter);
    }
    
    setFilteredRedemptions(filtered);
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
    setPage(1); // Reset to first page when filters change
  }, [statusFilter, typeFilter, redemptions]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
  };

  const handleViewDetails = (redemption) => {
    setSelectedRedemption(redemption);
    setOpenDetailsDialog(true);
  };

  const handleApproveClick = (redemption) => {
    setSelectedRedemption(redemption);
    setOpenApproveDialog(true);
  };

  const handleRejectClick = (redemption) => {
    setSelectedRedemption(redemption);
    setRejectionReason('');
    setOpenRejectDialog(true);
  };

  const handleApproveRedemption = async () => {
    setLoading(true);
    setError('');
    
    try {
      await axios.put(`/api/redemptions/${selectedRedemption._id}/approve`);
      
      // Update redemption status in the list
      const updatedRedemptions = redemptions.map(redemption => 
        redemption._id === selectedRedemption._id 
          ? { ...redemption, status: 'approved', approvedBy: currentUser._id, approvedAt: new Date() }
          : redemption
      );
      
      setRedemptions(updatedRedemptions);
      setSuccess(`Redemption request for ${selectedRedemption.user.name} approved successfully`);
      setOpenApproveDialog(false);
    } catch (error) {
      console.error('Error approving redemption:', error);
      setError('Failed to approve redemption request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRedemption = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await axios.put(`/api/redemptions/${selectedRedemption._id}/reject`, {
        reason: rejectionReason
      });
      
      // Update redemption status in the list
      const updatedRedemptions = redemptions.map(redemption => 
        redemption._id === selectedRedemption._id 
          ? { 
              ...redemption, 
              status: 'rejected', 
              rejectedBy: currentUser._id, 
              rejectedAt: new Date(),
              rejectionReason
            }
          : redemption
      );
      
      setRedemptions(updatedRedemptions);
      setSuccess(`Redemption request for ${selectedRedemption.user.name} rejected`);
      setOpenRejectDialog(false);
    } catch (error) {
      console.error('Error rejecting redemption:', error);
      setError('Failed to reject redemption request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'monetary':
        return 'Monetary Value';
      case 'career':
        return 'Career Progression';
      case 'benefits':
        return 'Special Benefits';
      default:
        return type;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get paginated redemptions
  const paginatedRedemptions = filteredRedemptions.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  if (loading && redemptions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Manage Redemption Requests
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Redemption Requests ({filteredRedemptions.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="type-filter-label">Type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={typeFilter}
                label="Type"
                onChange={handleTypeFilterChange}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="monetary">Monetary Value</MenuItem>
                <MenuItem value="career">Career Progression</MenuItem>
                <MenuItem value="benefits">Special Benefits</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        {filteredRedemptions.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Developer</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Requested On</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRedemptions.map((redemption) => (
                    <TableRow key={redemption._id} hover>
                      <TableCell>{redemption.user?.name || 'Unknown'}</TableCell>
                      <TableCell>{getTypeLabel(redemption.type)}</TableCell>
                      <TableCell>{redemption.amount} Tokens</TableCell>
                      <TableCell>
                        <Chip 
                          label={redemption.status} 
                          color={getStatusChipColor(redemption.status)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{formatDate(redemption.createdAt)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleViewDetails(redemption)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {redemption.status === 'pending' && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={() => handleApproveClick(redemption)}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Reject">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleRejectClick(redemption)}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
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
            No redemption requests found matching your criteria.
          </Typography>
        )}
      </Paper>
      
      {/* Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Redemption Request Details</DialogTitle>
        <DialogContent>
          {selectedRedemption && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {getTypeLabel(selectedRedemption.type)} Request
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Status: 
                  <Chip 
                    label={selectedRedemption.status} 
                    color={getStatusChipColor(selectedRedemption.status)} 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2">Developer</Typography>
                  <Typography variant="body2">{selectedRedemption.user?.name}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2">Amount</Typography>
                  <Typography variant="body2">{selectedRedemption.amount} Tokens</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2">Requested On</Typography>
                  <Typography variant="body2">{formatDate(selectedRedemption.createdAt)}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2">Last Updated</Typography>
                  <Typography variant="body2">{formatDate(selectedRedemption.updatedAt)}</Typography>
                </Box>
                
                {selectedRedemption.status === 'approved' && (
                  <>
                    <Box>
                      <Typography variant="subtitle2">Approved By</Typography>
                      <Typography variant="body2">{selectedRedemption.approvedBy?.name || 'N/A'}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2">Approved On</Typography>
                      <Typography variant="body2">{formatDate(selectedRedemption.approvedAt)}</Typography>
                    </Box>
                  </>
                )}
                
                {selectedRedemption.status === 'rejected' && (
                  <>
                    <Box>
                      <Typography variant="subtitle2">Rejected By</Typography>
                      <Typography variant="body2">{selectedRedemption.rejectedBy?.name || 'N/A'}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2">Rejected On</Typography>
                      <Typography variant="body2">{formatDate(selectedRedemption.rejectedAt)}</Typography>
                    </Box>
                  </>
                )}
                
                {selectedRedemption.transactionHash && (
                  <Box sx={{ gridColumn: '1 / span 2' }}>
                    <Typography variant="subtitle2">Transaction Hash</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {selectedRedemption.transactionHash}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2">Details</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                  <Typography variant="body2">{selectedRedemption.details}</Typography>
                </Paper>
              </Box>
              
              {selectedRedemption.status === 'rejected' && selectedRedemption.rejectionReason && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2">Rejection Reason</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#fff4f4' }}>
                    <Typography variant="body2">{selectedRedemption.rejectionReason}</Typography>
                  </Paper>
                </Box>
              )}
              
              {selectedRedemption.status === 'pending' && (
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button 
                    variant="contained" 
                    color="success" 
                    onClick={() => {
                      setOpenDetailsDialog(false);
                      handleApproveClick(selectedRedemption);
                    }}
                  >
                    Approve Request
                  </Button>
                  
                  <Button 
                    variant="contained" 
                    color="error"
                    onClick={() => {
                      setOpenDetailsDialog(false);
                      handleRejectClick(selectedRedemption);
                    }}
                  >
                    Reject Request
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Approve Dialog */}
      <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)}>
        <DialogTitle>Approve Redemption Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve this {selectedRedemption?.type} redemption request for {selectedRedemption?.amount} tokens from {selectedRedemption?.user?.name}?
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApproveDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleApproveRedemption} 
            color="success" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
        <DialogTitle>Reject Redemption Request</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for rejecting this {selectedRedemption?.type} redemption request for {selectedRedemption?.amount} tokens from {selectedRedemption?.user?.name}.
          </DialogContentText>
          
          <TextField
            label="Rejection Reason"
            multiline
            rows={4}
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleRejectRedemption} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageRedemptions;
