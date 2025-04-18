"use client";

import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Card, Typography, Spin } from 'antd';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import styles from './globals.css';

const { Title, Text } = Typography;
const { Search } = Input;

const Home = () => {
  const [featuredStories, setFeaturedStories] = useState([]);
  const [newStories, setNewStories] = useState([]);
  const [hotStories, setHotStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/stories');
        setFeaturedStories(response.data.filter((story) => story.featured));
        setNewStories(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setHotStories(response.data.filter((story) => story.hot));
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

  const renderStories = (stories: any[]) => {
    return stories.map((story) => (
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
