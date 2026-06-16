import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/HomePage'
import { ListingPage } from '@/pages/ListingPage'
import { PostPage } from '@/pages/PostPage'
import { ThoughtsPage } from '@/pages/ThoughtsPage'
import { AboutPage } from '@/pages/AboutPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts" element={<ListingPage />} />
        <Route path="/c/:slug" element={<ListingPage />} />
        <Route path="/posts/:slug" element={<PostPage />} />
        <Route path="/thoughts" element={<ThoughtsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
