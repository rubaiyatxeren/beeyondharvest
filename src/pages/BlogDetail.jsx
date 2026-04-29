import React, { useEffect, useState } from 'react';
import { I, ic } from '../components/common/Icons';
import { Sk } from '../components/common/Skeleton';
import { Spinner } from '../components/common/Spinner';
import { useToast } from '../components/providers/ToastProvider';
import { useAPI } from '../hooks/useAPI';
import { API } from '../utils/constants';
import { CDN } from '../utils/helpers';

const BlogDetail = ({ blog, onBack }) => {
    const { data: fullBlog, loading } = useAPI(blog._id ? `/api/blogs/${blog._id}` : null, [], !blog._id);
    const blogData = fullBlog?.data || fullBlog || blog;
    const [commentForm, setCommentForm] = useState({ author: "", email: "", body: "" });
    const [commenting, setCommenting] = useState(false);
    const [commentSuccess, setCommentSuccess] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (blogData._id && blogData.status === "published") {
            fetch(`${API}/api/blogs/${blogData._id}/views`, { method: "PUT" }).catch(() => { });
        }
    }, [blogData._id]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentForm.author || !commentForm.email || !commentForm.body) {
            toast("Please fill all required fields", "error");
            return;
        }
        setCommenting(true);
        try {
            const res = await fetch(`${API}/api/blogs/${blogData._id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(commentForm)
            });
            const data = await res.json();
            if (data.success) {
                toast("Comment submitted for review! We'll approve it shortly. ✅", "success");
                setCommentForm({ author: "", email: "", body: "" });
                setCommentSuccess(true);
                setTimeout(() => setCommentSuccess(false), 5000);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast(error.message || "Failed to submit comment", "error");
        } finally {
            setCommenting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8" style={{ animation: "fadeIn .3s ease" }}>
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-amber-600 mb-6 btn-bounce transition-colors font-medium">
                <I d={ic.chev_l} size={16} /> Back to Blog
            </button>

            {loading ? (
                <div className="space-y-4">
                    <Sk className="h-64 rounded-2xl" />
                    <Sk className="h-8 w-3/4" />
                    <Sk className="h-32" />
                </div>
            ) : (
                <>
                    {blogData.coverImage?.url && CDN(blogData.coverImage.url) && (
                        <img src={CDN(blogData.coverImage.url)} alt={blogData.coverImage.alt || blogData.title}
                            className="w-full h-64 sm:h-96 object-cover rounded-2xl mb-7 shadow-lg" />
                    )}

                    <div className="flex items-center gap-2 mb-6 flex-wrap">
                        {blogData.category && (
                            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">{blogData.category}</span>
                        )}
                        {blogData.tags && blogData.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="bg-stone-100 text-stone-600 text-xs px-2 py-1 rounded-full">#{tag}</span>
                        ))}
                        <span className="text-stone-400 text-xs">
                            {new Date(blogData.publishedAt || blogData.createdAt).toLocaleDateString("en-BD", {
                                year: "numeric", month: "long", day: "numeric"
                            })}
                        </span>
                        <span className="text-stone-400 text-xs flex items-center gap-1">
                            <I d={ic.eye} size={12} /> {blogData.views || 0} views
                        </span>
                        {blogData.readingTime && (
                            <span className="text-stone-400 text-xs flex items-center gap-1">
                                <I d={ic.clock} size={12} /> {blogData.readingTime} min read
                            </span>
                        )}
                    </div>

                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 mb-4 leading-tight">{blogData.title}</h1>

                    {blogData.author && (
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm">
                                {blogData.author.name?.charAt(0) || "A"}
                            </div>
                            <div>
                                <div className="font-semibold text-stone-800 text-sm">{blogData.author.name || "Admin"}</div>
                                {blogData.author.bio && <div className="text-stone-500 text-xs">{blogData.author.bio}</div>}
                            </div>
                        </div>
                    )}

                    {blogData.excerpt && (
                        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 italic text-stone-700">{blogData.excerpt}</div>
                    )}

                    <div className="prose max-w-none text-stone-600 leading-relaxed text-base sm:text-lg mb-8">
                        <div dangerouslySetInnerHTML={{
                            __html: (blogData.body || blogData.content || "")
                                .replace(/\n/g, "<br>")
                                .replace(/<h2/g, '<h2 class="text-2xl font-display font-bold text-stone-900 mt-8 mb-4"')
                                .replace(/<h3/g, '<h3 class="text-xl font-display font-bold text-stone-900 mt-6 mb-3"')
                                .replace(/<p/g, '<p class="mb-4"')
                                .replace(/<ul/g, '<ul class="list-disc list-inside mb-4"')
                                .replace(/<ol/g, '<ol class="list-decimal list-inside mb-4"')
                                .replace(/<li/g, '<li class="mb-1"')
                                .replace(/<blockquote/g, '<blockquote class="border-l-4 border-amber-400 pl-4 italic bg-amber-50 py-2 my-4"')
                        }} />
                    </div>

                    {blogData.gallery && blogData.gallery.length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-display font-semibold text-stone-800 mb-4">Gallery</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {blogData.gallery.map((image, index) => (
                                    <img key={index} src={CDN(image.url)} alt={image.alt || `Gallery image ${index + 1}`}
                                        className="w-full h-48 object-cover rounded-xl shadow-md" />
                                ))}
                            </div>
                        </div>
                    )}

                    {blogData.allowComments && (
                        <div className="border-t border-stone-100 pt-8 mb-8">
                            <h3 className="font-display font-semibold text-stone-800 mb-4">
                                Comments ({blogData.comments ? blogData.comments.filter(c => c.isApproved).length : 0})
                            </h3>

                            {commentSuccess ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center mb-6">
                                    <div className="text-emerald-600 text-lg mb-2">✅</div>
                                    <h4 className="font-semibold text-emerald-700 mb-2">Comment Submitted!</h4>
                                    <p className="text-emerald-600 text-sm">Your comment is under review. We'll approve it shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleCommentSubmit} className="bg-stone-50 rounded-2xl p-5 mb-6">
                                    <h4 className="font-semibold text-stone-700 mb-3">Leave a Comment</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Name *</label>
                                            <input type="text" value={commentForm.author} onChange={(e) => setCommentForm({ ...commentForm, author: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Email *</label>
                                            <input type="email" value={commentForm.email} onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm" required />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-xs font-semibold text-stone-500 mb-1.5">Comment *</label>
                                        <textarea value={commentForm.body} onChange={(e) => setCommentForm({ ...commentForm, body: e.target.value })}
                                            rows={4} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm resize-none" required />
                                    </div>
                                    <button type="submit" disabled={commenting}
                                        className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-5 py-2.5 rounded-xl btn-bounce transition-colors text-sm disabled:opacity-60">
                                        {commenting ? <Spinner /> : "Post Comment"}
                                    </button>
                                </form>
                            )}

                            {blogData.comments && blogData.comments.filter(c => c.isApproved).length > 0 ? (
                                <div className="space-y-4">
                                    {blogData.comments.filter(c => c.isApproved).map((comment) => (
                                        <div key={comment._id} className="bg-white rounded-xl p-4 border border-stone-100">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 text-xs font-bold">
                                                    {comment.author.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-stone-800 text-sm">{comment.author}</div>
                                                    <div className="text-stone-400 text-xs">{new Date(comment.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <p className="text-stone-600 text-sm">{comment.body}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-stone-400 text-sm text-center py-4">No comments yet. Be the first to comment!</p>
                            )}
                        </div>
                    )}

                    <div className="border-t border-stone-100 pt-6 mb-8">
                        <div className="flex items-center gap-3">
                            <span className="text-stone-500 text-sm">Share this post:</span>
                            {["facebook", "twitter", "linkedin", "whatsapp"].map(platform => (
                                <button key={platform}
                                    className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors flex items-center justify-center text-stone-600"
                                    onClick={() => {
                                        const url = encodeURIComponent(window.location.href);
                                        const title = encodeURIComponent(blogData.title);
                                        const shareUrls = {
                                            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                                            twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
                                            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
                                            whatsapp: `https://wa.me/?text=${title} ${url}`
                                        };
                                        window.open(shareUrls[platform], '_blank');
                                    }}>
                                    <span className="text-sm">
                                        {platform === 'facebook' ? '📘' : platform === 'twitter' ? '🐦' : platform === 'linkedin' ? '💼' : '💚'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default BlogDetail;