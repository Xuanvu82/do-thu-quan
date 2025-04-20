"use client";

import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Card, Typography, Spin } from 'antd';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import './globals.css'; // Change this line
import type { Story } from './globals'; // Import the Story type

const { Title, Text } = Typography;
const { Search } = Input;

const Home = () => {
  const [featuredStories, setFeaturedStories] = useState<Story[]>([]); // Use Story[] type
  const [newStories, setNewStories] = useState<Story[]>([]); // Use Story[] type
  const [hotStories, setHotStories] = useState<Story[]>([]); // Use Story[] type
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        // Assuming the API returns an array of Story objects
        const response = await axios.get<{ data: Story[] }>('/api/stories');
        // Adjust based on actual API response structure if needed
        const allStories = response.data.data; // Assuming API wraps data in a 'data' property
        setFeaturedStories(allStories.filter((story: Story) => story.featured)); // Add type Story here
        // Ensure createdAt is comparable (string or Date)
        setNewStories([...allStories].sort((a: Story, b: Story) => { // Add types Story here
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }));
        setHotStories(allStories.filter((story: Story) => story.hot)); // Add type Story here
      } catch (error) {
        console.error('Error fetching stories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const handleSearch = (value: string) => {
    router.push(`/search?query=${value}`);
  };

  const renderStories = (stories: Story[]) => { // Use Story[] type for the parameter
    return stories.map((story: Story) => ( // Explicitly type story as Story
      <Col xs={24} sm={12} md={8} lg={6} key={story._id}>
        <Card
          hoverable
          cover={<img alt={story.title} src={story.coverImage || '/default-cover.jpg'} />}
          onClick={() => router.push(`/story/${story._id}`)}
        >
          <Title level={5}>{story.title}</Title>
          <Text>Author: {story.author}</Text>
          <br />
          <Text>Genres: {story.genres.join(', ')}</Text>
          <br />
          <Text>Status: {story.status}</Text>
          <br />
          <Text>{story.description}</Text>
        </Card>
      </Col>
    ));
  };

  return (
    <div style={{ padding: '20px' }}>
      <Search
        placeholder="Search stories by title or author"
        enterButton="Search"
        size="large"
        onSearch={handleSearch}
        style={{ marginBottom: '20px' }}
      />

      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />
      ) : (
        <>
          <Title level={3}>Truyện nổi bật</Title>
          <Row gutter={[16, 16]}>{renderStories(featuredStories)}</Row>

          <Title level={3} style={{ marginTop: '40px' }}>Truyện mới</Title>
          <Row gutter={[16, 16]}>{renderStories(newStories)}</Row>

          <Title level={3} style={{ marginTop: '40px' }}>Truyện hot</Title>
          <Row gutter={[16, 16]}>{renderStories(hotStories)}</Row>
        </>
      )}
    </div>
  );
};

export default Home;
