"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Button, Select, Spin } from 'antd';
import axios from 'axios';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const ChapterReader = ({ params }: { params: { id: string; chapterId: string } }) => {
  const { id, chapterId } = params;
  const router = useRouter();

  const [chapter, setChapter] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        setLoading(true);
        const [chapterRes, chaptersRes] = await Promise.all([
          axios.get(`/api/stories/${id}/chapters/${chapterId}`),
          axios.get(`/api/stories/${id}/chapters`),
        ]);

        setChapter(chapterRes.data);
        setChapters(chaptersRes.data);
      } catch (error) {
        console.error('Error fetching chapter data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [id, chapterId]);

  const handleFontSizeChange = (increment: number) => {
    setFontSize((prev) => Math.max(12, prev + increment));
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleChapterSelect = (value: string) => {
    router.push(`/story/${id}/chapter/${value}`);
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
      color: darkMode ? '#ffffff' : '#000000',
      minHeight: '100vh',
    }}>
      {chapter && (
        <>
          <Title level={2} style={{ fontSize: `${fontSize}px` }}>{chapter.title}</Title>
          <Paragraph style={{ fontSize: `${fontSize}px` }}>{chapter.content}</Paragraph>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button
              disabled={!chapter.prevChapterId}
              onClick={() => router.push(`/story/${id}/chapter/${chapter.prevChapterId}`)}
            >
              Chương trước
            </Button>
            <Button
              disabled={!chapter.nextChapterId}
              onClick={() => router.push(`/story/${id}/chapter/${chapter.nextChapterId}`)}
            >
              Chương tiếp theo
            </Button>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Select
              value={chapterId}
              onChange={handleChapterSelect}
              style={{ width: '200px' }}
            >
              {chapters.map((chap) => (
                <Option key={chap.id} value={chap.id}>{chap.title}</Option>
              ))}
            </Select>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Button onClick={() => handleFontSizeChange(2)}>Tăng kích thước chữ</Button>
            <Button onClick={() => handleFontSizeChange(-2)} style={{ marginLeft: '10px' }}>Giảm kích thước chữ</Button>
            <Button onClick={toggleDarkMode} style={{ marginLeft: '10px' }}>
              {darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChapterReader;