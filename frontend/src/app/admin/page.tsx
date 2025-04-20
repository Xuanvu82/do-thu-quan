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
  AlertProps,
} from '@mui/material';
import axios from 'axios';

type SnackbarState = {
  open: boolean;
  message: string;
  severity: AlertProps['severity'];
};

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
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [startChapter, setStartChapter] = useState<number | undefined>(1);
  const [endChapter, setEndChapter] = useState<number | undefined>(undefined);
  const [delaySeconds, setDelaySeconds] = useState<number | undefined>(1);

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
      const payload = {
        ...formValues,
        genres: formValues.genres.split(',').map(g => g.trim()).filter(g => g !== ''),
      };
      await axios.post('/api/stories', payload);
      setSnackbar({ open: true, message: 'Story added successfully', severity: 'success' });
      setIsDialogOpen(false);
      setFormValues({ title: '', author: '', genres: '', description: '', coverImage: '' });
      fetchStories();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to add story', severity: 'error' });
    }
  };

  const handleScrape = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/tools/scrape', {
        url: scrapeUrl,
        startChapterIndex: startChapter,
        endChapterIndex: endChapter,
        delaySeconds: delaySeconds,
      });
      setSnackbar({ open: true, message: 'Scraping completed successfully', severity: 'success' });
      setScrapeDialogOpen(false);
      setScrapeUrl('');
      setStartChapter(1);
      setEndChapter(undefined);
      setDelaySeconds(1);
      fetchStories();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to scrape data';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (setter: React.Dispatch<React.SetStateAction<number | undefined>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setter(value === '' ? undefined : parseFloat(value));
    };

  return (
    <div style={{ padding: '20px' }}>
      <Button variant="contained" color="primary" onClick={() => setIsDialogOpen(true)} style={{ marginBottom: '20px', marginRight: '10px' }}>
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

      {loading && !isDialogOpen && !scrapeDialogOpen ? (
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

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Story</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            name="title"
            value={formValues.title}
            onChange={handleFormChange}
            fullWidth
            margin="dense"
            required
          />
          <TextField
            label="Author"
            name="author"
            value={formValues.author}
            onChange={handleFormChange}
            fullWidth
            margin="dense"
            required
          />
          <TextField
            label="Genres (comma-separated)"
            name="genres"
            value={formValues.genres}
            onChange={handleFormChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Description"
            name="description"
            value={formValues.description}
            onChange={handleFormChange}
            fullWidth
            margin="dense"
            multiline
            rows={4}
          />
          <TextField
            label="Cover Image URL"
            name="coverImage"
            value={formValues.coverImage}
            onChange={handleFormChange}
            fullWidth
            margin="dense"
            type="url"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddStory} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scrapeDialogOpen} onClose={() => setScrapeDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Scrape Story from URL</DialogTitle>
        <DialogContent>
          <TextField
            label="Website URL"
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            fullWidth
            margin="dense"
            required
            type="url"
          />
          <TextField
            label="Start Chapter (1-based)"
            type="number"
            value={startChapter ?? ''}
            onChange={handleNumberInputChange(setStartChapter)}
            fullWidth
            margin="dense"
            InputProps={{ inputProps: { min: 1 } }}
            placeholder="Default: 1"
          />
          <TextField
            label="End Chapter (1-based)"
            type="number"
            value={endChapter ?? ''}
            onChange={handleNumberInputChange(setEndChapter)}
            fullWidth
            margin="dense"
            InputProps={{ inputProps: { min: 1 } }}
            placeholder="Default: Last Chapter"
          />
          <TextField
            label="Delay Between Chapters (seconds)"
            type="number"
            value={delaySeconds ?? ''}
            onChange={handleNumberInputChange(setDelaySeconds)}
            fullWidth
            margin="dense"
            InputProps={{ inputProps: { min: 0, step: 0.1 } }}
            placeholder="Default: 1"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScrapeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleScrape} variant="contained" color="primary" disabled={loading || !scrapeUrl}>
            {loading ? <CircularProgress size={24} /> : 'Scrape'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AdminPage;