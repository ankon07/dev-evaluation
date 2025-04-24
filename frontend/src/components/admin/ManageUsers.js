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
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

// Validation schema for user creation/edit
const UserSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  role: Yup.string()
    .oneOf(['developer', 'admin', 'hr'], 'Invalid role')
    .required('Role is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .when('isEditing', {
      is: false,
      then: Yup.string().required('Password is required'),
      otherwise: Yup.string()
    }),
  walletAddress: Yup.string()
    .matches(/^(0x)?[0-9a-fA-F]{40}$/, 'Invalid Ethereum address')
    .nullable(),
  isActive: Yup.boolean()
});

const ManageUsers = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [sortField, setSortField] = useState('name'); // 'name', 'email', 'role'
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [currentUser_, setCurrentUser_] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get('/api/admin/users');
        setUsers(response.data.data);
        setFilteredUsers(response.data.data);
        setTotalPages(Math.ceil(response.data.data.length / rowsPerPage));
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'hr')) {
      fetchUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    // Filter users based on search term and role filter
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        (user && user.name ? user.name.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
        (user && user.email ? user.email.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
        (user && user.role ? user.role.toLowerCase().includes(searchTerm.toLowerCase()) : false)
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user && user.role && user.role === roleFilter);
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      if (sortField === 'name') {
        valueA = a && a.name ? a.name.toLowerCase() : '';
        valueB = b && b.name ? b.name.toLowerCase() : '';
      } else if (sortField === 'email') {
        valueA = a && a.email ? a.email.toLowerCase() : '';
        valueB = b && b.email ? b.email.toLowerCase() : '';
      } else if (sortField === 'role') {
        valueA = a && a.role ? a.role.toLowerCase() : '';
        valueB = b && b.role ? b.role.toLowerCase() : '';
      } else {
        valueA = a && a.createdAt ? a.createdAt : '';
        valueB = b && b.createdAt ? b.createdAt : '';
      }
      
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    setFilteredUsers(filtered);
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
    setPage(1); // Reset to first page when filters change
  }, [searchTerm, roleFilter, sortOrder, sortField, users]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleSortFieldChange = (field) => {
    if (sortField === field) {
      toggleSortOrder();
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleAddUser = () => {
    setDialogMode('add');
    setCurrentUser_(null);
    setOpenDialog(true);
  };

  const handleEditUser = (user) => {
    setDialogMode('edit');
    setCurrentUser_(user);
    setOpenDialog(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.delete(`/api/admin/users/${userToDelete._id}`);
      
      // Update users list
      setUsers(users.filter(user => user._id !== userToDelete._id));
      setSuccess(`User ${userToDelete.name} deleted successfully`);
      setOpenDeleteDialog(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUser = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (dialogMode === 'add') {
        // Create new user
        const response = await axios.post('/api/admin/users', values);
        setUsers([...users, response.data.data]);
        setSuccess('User created successfully');
      } else {
        // Update existing user
        const response = await axios.put(`/api/admin/users/${currentUser_._id}`, values);
        setUsers(users.map(user => user._id === currentUser_._id ? response.data.data : user));
        setSuccess('User updated successfully');
      }
      
      resetForm();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error managing user:', error);
      setError(error.response?.data?.error || 'Failed to manage user. Please try again.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const getRoleChipColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'hr':
        return 'warning';
      case 'developer':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Get paginated users
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Manage Users
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
            Users ({filteredUsers.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              placeholder="Search users..."
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
              <InputLabel id="role-filter-label">Role</InputLabel>
              <Select
                labelId="role-filter-label"
                value={roleFilter}
                label="Role"
                onChange={handleRoleFilterChange}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="hr">HR</MenuItem>
                <MenuItem value="developer">Developer</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddUser}
            >
              Add User
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {filteredUsers.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      onClick={() => handleSortFieldChange('name')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Name
                        {sortField === 'name' && (
                          <SortIcon sx={{ ml: 0.5, transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSortFieldChange('email')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Email
                        {sortField === 'email' && (
                          <SortIcon sx={{ ml: 0.5, transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSortFieldChange('role')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Role
                        {sortField === 'role' && (
                          <SortIcon sx={{ ml: 0.5, transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>Wallet Connected</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user && user._id ? user._id : Math.random()} hover>
                      <TableCell>{user && user.name ? user.name : 'N/A'}</TableCell>
                      <TableCell>{user && user.email ? user.email : 'N/A'}</TableCell>
                      <TableCell>
                        {user && user.role ? (
                          <Chip 
                            label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                            color={getRoleChipColor(user.role)} 
                            size="small" 
                          />
                        ) : (
                          <Chip 
                            label="Unknown" 
                            color="default" 
                            size="small" 
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {user && user.walletAddress ? (
                          <Tooltip title={user.walletAddress}>
                            <Chip 
                              label="Connected" 
                              color="success" 
                              size="small" 
                            />
                          </Tooltip>
                        ) : (
                          <Chip 
                            label="Not Connected" 
                            color="default" 
                            size="small" 
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user && user.isActive ? 'Active' : 'Inactive'} 
                          color={user && user.isActive ? 'success' : 'error'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditUser(user)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteUser(user)}
                            disabled={user._id === currentUser._id} // Prevent deleting yourself
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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
            No users found matching your criteria.
          </Typography>
        )}
      </Paper>
      
      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New User' : 'Edit User'}
        </DialogTitle>
        <Formik
          initialValues={{
            name: currentUser_?.name || '',
            email: currentUser_?.email || '',
            role: currentUser_?.role || 'developer',
            password: '',
            walletAddress: currentUser_?.walletAddress || '',
            isActive: currentUser_?.isActive !== undefined ? currentUser_?.isActive : true,
            isEditing: dialogMode === 'edit'
          }}
          validationSchema={UserSchema}
          onSubmit={handleSubmitUser}
          enableReinitialize
        >
          {({ errors, touched, isSubmitting, values, setFieldValue }) => (
            <Form>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="name"
                      label="Full Name"
                      fullWidth
                      variant="outlined"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      disabled={loading || isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="email"
                      label="Email Address"
                      fullWidth
                      variant="outlined"
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                      disabled={loading || isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="role-label">Role</InputLabel>
                      <Field
                        as={Select}
                        labelId="role-label"
                        name="role"
                        label="Role"
                        disabled={loading || isSubmitting}
                      >
                        <MenuItem value="developer">Developer</MenuItem>
                        <MenuItem value="hr">HR</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Field>
                      {touched.role && errors.role && (
                        <Typography color="error" variant="caption">
                          {errors.role}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  {dialogMode === 'add' && (
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        name="password"
                        label="Password"
                        type="password"
                        fullWidth
                        variant="outlined"
                        error={touched.password && Boolean(errors.password)}
                        helperText={touched.password && errors.password}
                        disabled={loading || isSubmitting}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="walletAddress"
                      label="Ethereum Wallet Address (Optional)"
                      fullWidth
                      variant="outlined"
                      error={touched.walletAddress && Boolean(errors.walletAddress)}
                      helperText={touched.walletAddress && errors.walletAddress}
                      disabled={loading || isSubmitting}
                      placeholder="0x..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.isActive}
                          onChange={(e) => setFieldValue('isActive', e.target.checked)}
                          color="primary"
                          disabled={loading || isSubmitting}
                        />
                      }
                      label="Active Account"
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)} disabled={loading || isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={loading || isSubmitting}
                  startIcon={dialogMode === 'add' ? <PersonAddIcon /> : <EditIcon />}
                >
                  {loading || isSubmitting ? <CircularProgress size={24} /> : dialogMode === 'add' ? 'Add User' : 'Update User'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user <strong>{userToDelete?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteUser} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageUsers;
