"use client";

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Typography, Button, List, Pagination, Spin } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

const StoryDetail = ({ params }: { params: { id: string } }) => {
  const resolvedParams = use(Promise.resolve(params));
  const { id } = resolvedParams;
  const router = useRouter();

  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [relatedStories, setRelatedStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalChapters, setTotalChapters] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const fetchFavorites = useCallback(async () => {
    try {
      const favRes = await axios.get('/api/favorites');
      const favoriteStoryIds = favRes.data.map((favStory: any) => favStory._id);
      setIsFavorited(favoriteStoryIds.includes(id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }, [id]);

  useEffect(() => {
    const fetchStoryDetails = async () => {
      try {
        setLoading(true);
        const [storyRes, chaptersRes, relatedRes, _favRes] = await Promise.all([
          axios.get(`/api/stories/${id}`),
          axios.get(`/api/stories/${id}/chapters?page=${currentPage}`),
          axios.get(`/api/stories?relatedTo=${id}`),
          fetchFavorites()
        ]);

        setStory(storyRes.data);
        setChapters(chaptersRes.data.chapters);
        setTotalChapters(chaptersRes.data.total);
        setRelatedStories(relatedRes.data);
      } catch (error) {
        console.error('Error fetching story details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryDetails();
  }, [id, currentPage, fetchFavorites]);

  const handleToggleFavorite = async () => {
    setIsTogglingFavorite(true);
    try {
      if (isFavorited) {
        await axios.delete(`/api/favorites/${id}`);
        setIsFavorited(false);
        alert('Story removed from favorites!');
      } else {
        await axios.post(`/api/favorites`, { storyId: id });
        setIsFavorited(true);
        alert('Story added to favorites!');
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      alert('Failed to update favorites. Please try again.');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleChapterClick = (chapterId: string) => {
    if (chapterId && !chapterId.startsWith('chapter-')) {
      router.push(`/story/${id}/chapter/${chapterId}`);
    } else {
      console.warn('Invalid chapter ID/URL:', chapterId);
      alert('Cannot navigate to this chapter.');
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <div style={{ padding: '20px' }}>
      {story && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <img
              src={story.coverImage || undefined}
              alt={story.title}
              style={{ width: '200px', height: '300px', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.jpg'; }}
            />
            <div>
              <Title level={2}>{story.title}</Title>
              <Text>Author: {story.author}</Text>
              <br />
              <Text>Genre: {Array.isArray(story.genres) ? story.genres.join(', ') : story.genres}</Text>
              <br />
              <Text>Status: {story.status || 'Updating...'}</Text>
              <br />
              <Text>{story.description}</Text>
              <br />
              <Button
                type={isFavorited ? "default" : "primary"}
                onClick={handleToggleFavorite}
                style={{ marginTop: '10px' }}
                loading={isTogglingFavorite}
              >
                {isFavorited ? 'Unfollow' : 'Follow'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Title level={3}>Chapters</Title>
      <List
        bordered
        dataSource={chapters}
        renderItem={(chapter) => (
          <List.Item key={chapter.id || chapter.title} onClick={() => handleChapterClick(chapter.id)} style={{ cursor: 'pointer' }}>
            {chapter.title}
          </List.Item>
        )}
      />
      <Pagination
        current={currentPage}
        total={totalChapters}
        pageSize={10}
        onChange={(page) => setCurrentPage(page)}
        style={{ marginTop: '20px', textAlign: 'center' }}
      />

      <Title level={3} style={{ marginTop: '40px' }}>Related Stories</Title>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {relatedStories.map((related) => (
          <Card
            key={related.id}
            hoverable
            cover={
              <img
                alt={related.title}
                src={related.coverImage || undefined}
                style={{ height: '150px', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.jpg'; }}
              />
            }
            onClick={() => router.push(`/story/${related.id}`)}
            style={{ width: '200px' }}
          >
            <Title level={5}>{related.title}</Title>
            <Text>Author: {related.author}</Text>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StoryDetail;