"use client";

import React, { useState, useEffect } from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import axios from 'axios';

const AdminPage = () => {
  const [stories, setStories] = useState<{ _id: string; title: string; author: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    title: '',
    author: '',
    genres: '',
    description: '',
    coverImage: '',
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'success' });
  const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/stories');
      setStories(response.data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to fetch stories', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/stories/${id}`);
      setSnackbar({ open: true, message: 'Story deleted successfully', severity: 'success' });
      fetchStories();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete story', severity: 'error' });
    }
  };

  const handleAddStory = async () => {
    try {
      await axios.post('/api/stories', formValues);
      setSnackbar({ open: true, message: 'Story added successfully', severity: 'success' });
      setIsDialogOpen(false);
      setFormValues({ title: '', author: '', genres: '', description: '', coverImage: '' });
      fetchStories();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to add story', severity: 'error' });
    }
  };

  const handleScrape = async () => {
    try {
      const response = await axios.post('/api/tools/scrape', { url: scrapeUrl });
      setSnackbar({ open: true, message: 'Scraping completed successfully', severity: 'success' });
      setScrapeDialogOpen(false);
      setScrapeUrl('');
      fetchStories();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to scrape data', severity: 'error' });
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ padding: '20px' }}>
      <Button variant="contained" color="primary" onClick={() => setIsDialogOpen(true)} style={{ marginBottom: '20px' }}>
        Add New Story
      </Button>

      <Button
        variant="contained"
        color="secondary"
        onClick={() => setScrapeDialogOpen(true)}
        style={{ marginBottom: '20px' }}
      >
        Scrape Data
      </Button>

      {loading ? (
        <CircularProgress style={{ display: 'block', margin: '20px auto' }} />
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stories.map((story) => (
                <TableRow key={story._id}>
                  <TableCell>{story.title}</TableCell>
                  <TableCell>{story.author}</TableCell>
                  <TableCell>
                    <Button color="error" onClick={() => handleDelete(story._id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Add New Story</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            name="title"
            value={formValues.title}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Author"
            name="author"
            value={formValues.author}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Genres"
            name="genres"
            value={formValues.genres}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            name="description"
            value={formValues.description}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
            multiline
            rows={4}
          />
          <TextField
            label="Cover Image URL"
            name="coverImage"
            value={formValues.coverImage}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddStory} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scrapeDialogOpen} onClose={() => setScrapeDialogOpen(false)}>
        <DialogTitle>Scrape Data</DialogTitle>
        <DialogContent>
          <TextField
            label="Website URL"
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScrapeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleScrape} variant="contained" color="primary">
            Scrape
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AdminPage;