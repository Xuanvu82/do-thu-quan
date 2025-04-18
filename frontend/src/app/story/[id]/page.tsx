"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Typography, Button, List, Pagination, Spin } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

const StoryDetail = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const router = useRouter();

  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [relatedStories, setRelatedStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalChapters, setTotalChapters] = useState(0);

  useEffect(() => {
    const fetchStoryDetails = async () => {
      try {
        setLoading(true);
        const [storyRes, chaptersRes, relatedRes] = await Promise.all([
          axios.get(`/api/stories/${id}`),
          axios.get(`/api/stories/${id}/chapters?page=${currentPage}`),
          axios.get(`/api/stories?relatedTo=${id}`),
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
  }, [id, currentPage]);

  const handleFollow = async () => {
    try {
      await axios.post(`/api/users/1/favorites`, { storyId: id });
      alert('Story added to favorites!');
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const handleChapterClick = (chapterId: string) => {
    router.push(`/story/${id}/chapter/${chapterId}`);
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <div style={{ padding: '20px' }}>
      {story && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <img src={story.coverImage} alt={story.title} style={{ width: '200px', height: '300px', objectFit: 'cover' }} />
            <div>
              <Title level={2}>{story.title}</Title>
              <Text>Author: {story.author}</Text>
              <br />
              <Text>Genre: {story.genre}</Text>
              <br />
              <Text>Status: {story.status}</Text>
              <br />
              <Text>{story.description}</Text>
              <br />
              <Button type="primary" onClick={handleFollow} style={{ marginTop: '10px' }}>
                Follow
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
          <List.Item onClick={() => handleChapterClick(chapter.id)} style={{ cursor: 'pointer' }}>
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
            cover={<img alt={related.title} src={related.coverImage} />}
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