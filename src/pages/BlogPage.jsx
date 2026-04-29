import React, { useState } from 'react';
import { Sk } from '../components/common/Skeleton';
import { useAPI } from '../hooks/useAPI';
import { CDN } from '../utils/helpers';
import BlogDetail from './BlogDetail';

const BlogPage = () => {
    const [selected, setSelected] = useState(null);
    const { data: raw, loading } = useAPI("/api/blogs?status=published&limit=12");
    const blogs = raw?.blogs || raw || [];

    if (selected) return <BlogDetail blog={selected} onBack={() => setSelected(null)} />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="text-center mb-10">
                <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">Honey Blog</h1>
                <p className="text-stone-500">Tips, recipes, and insights from our beekeepers</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                            <Sk className="h-44 rounded-none" />
                            <div className="p-5 space-y-2">
                                <Sk className="h-3 w-1/3" />
                                <Sk className="h-5" />
                                <Sk className="h-3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : blogs.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">📝</div>
                    <p className="text-stone-400">No posts yet. Check back soon!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blogs.map((blog) => (
                        <div key={blog._id} onClick={() => setSelected(blog)} className="card-hover bg-white rounded-2xl border border-stone-100 overflow-hidden cursor-pointer">
                            <div className="relative h-44 bg-amber-50 overflow-hidden">
                                {blog.coverImage?.url && CDN(blog.coverImage.url) ? (
                                    <img src={CDN(blog.coverImage.url)} alt={blog.title} className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-5xl">🍯</div>
                                )}
                            </div>
                            <div className="p-5">
                                {blog.category && (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mb-2 inline-block">
                                        {blog.category}
                                    </span>
                                )}
                                <h3 className="font-display font-semibold text-stone-800 text-base line-clamp-2 mb-2 leading-snug">{blog.title}</h3>
                                <p className="text-stone-400 text-sm line-clamp-2 mb-4">{blog.excerpt || (blog.body || "").replace(/<[^>]*>/g, "").slice(0, 100)}…</p>
                                <div className="flex justify-between text-xs text-stone-400">
                                    <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</span>
                                    <span>{blog.likes || 0} ❤️ · {blog.views || 0} 👁</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlogPage;