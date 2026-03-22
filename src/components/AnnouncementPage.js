// =====================================================
// CrickEdge Announcement Module
// FINAL PRODUCTION VERSION
// Improvements added with STEP comments
// =====================================================

import React,
{
    useState,
    useEffect
}
    from "react";

import axios from "axios";

import ReactQuill from "react-quill";

import "react-quill/dist/quill.snow.css";

import Highlighter from "react-highlight-words";

import "./AnnouncementPage.css";

import { format } from "date-fns";

import {
    FaWhatsapp,
    FaLink,
    FaThumbtack,
    FaEdit,
    FaTrash
}
    from "react-icons/fa";

import { useParams } from "react-router-dom";

////////////////////////////////////////////////

const API =
    "https://cricket-scoreboard-backend.onrender.com/api/announcements";

////////////////////////////////////////////////

function AnnouncementPage({ user }) {

    // STEP 1 — Deep link support
    const { id } = useParams();

    const [announcements, setAnnouncements] = useState([]);

    const [search, setSearch] = useState("");

    const [editorOpen, setEditorOpen] = useState(false);

    const [title, setTitle] = useState("");

    const [content, setContent] = useState("");

    const [category, setCategory] = useState("General");

    const [pinned, setPinned] = useState(false);

    const [editId, setEditId] = useState(null);

    ////////////////////////////////////////////////

    // STEP 2 — Load announcements
    useEffect(() => {

        loadAnnouncements();

    }, []);

    ////////////////////////////////////////////////

    // STEP 3 — Scroll to shared announcement
    useEffect(() => {

        if (id && announcements.length > 0) {

            setTimeout(() => {

                const el = document.getElementById(id);

                if (el) {
                    el.scrollIntoView({
                        behavior: "smooth"
                    });
                }

            }, 400);

        }

    }, [id, announcements]);

    ////////////////////////////////////////////////

    // STEP 4 — Load data from backend
    const loadAnnouncements = async () => {

        try {

            const res =
                await axios.get(API + "/all");

            setAnnouncements(res.data);

        }
        catch {

            alert("Failed loading announcements");

        }

    };

    ////////////////////////////////////////////////

    // STEP 5 — Open create modal
    const openCreate = () => {

        setEditorOpen(true);

        setEditId(null);

        setTitle("");

        setContent("");

        setPinned(false);

        setCategory("General");

    };

    ////////////////////////////////////////////////

    // STEP 6 — Save announcement
    const submit = async () => {

        if (!title || !content) {
            alert("Enter title and content");
            return;
        }

        try {

            if (editId) {

                await axios.put(

                    API + "/update/" + editId,

                    {
                        title,
                        content,
                        category,
                        is_pinned: pinned,
                        is_published: true
                    }

                );

            }
            else {

                await axios.post(

                    API + "/create",

                    {
                        title,
                        content,
                        category,
                        is_pinned: pinned
                    }

                );

            }

            setEditorOpen(false);

            loadAnnouncements();

        }
        catch {

            alert("Error saving announcement");

        }

    };

    ////////////////////////////////////////////////

    // STEP 7 — Edit announcement
    const editAnnouncement = (a) => {

        setEditorOpen(true);

        setEditId(a.id);

        setTitle(a.title);

        setContent(a.content);

        setCategory(a.category);

        setPinned(a.is_pinned);

    };

    ////////////////////////////////////////////////

    // STEP 8 — Delete announcement
    const deleteAnnouncement = async (id) => {

        if (!window.confirm("Delete announcement?"))
            return;

        await axios.delete(
            API + "/delete/" + id
        );

        loadAnnouncements();

    };

    ////////////////////////////////////////////////

    // STEP 9 — WhatsApp share
    const shareWhatsApp = (id) => {

        const link =
            window.location.origin +
            "/announcement/" + id;

        window.open(
            "https://wa.me/?text=" + link
        );

    };

    ////////////////////////////////////////////////

    // STEP 10 — Copy link
    const copyLink = (id) => {

        const link =
            window.location.origin +
            "/announcement/" + id;

        navigator.clipboard.writeText(link);

        alert("Link copied");

    };

    ////////////////////////////////////////////////

    // STEP 11 — Category colors
    const getCategoryClass = (cat) => {

        if (cat === "Tournament")
            return "category tournament";

        if (cat === "Finance")
            return "category finance";

        if (cat === "System")
            return "category system";

        return "category general";

    };

    ////////////////////////////////////////////////

    // STEP 12 — Search filter
    const filtered =
        announcements.filter(a =>

            a.title.toLowerCase()
                .includes(search.toLowerCase())

            ||

            a.content.toLowerCase()
                .includes(search.toLowerCase())

        );

    ////////////////////////////////////////////////

    // STEP 13 — Rich editor toolbar (IMPROVED)
    // STEP — Full professional editor toolbar
    const modules = {

        toolbar: [

            [{ header: [1, 2, 3, 4, false] }],

            ["bold", "italic", "underline", "strike"],

            [{ color: [] }, { background: [] }],

            [{ list: "ordered" }, { list: "bullet" }],

            [{ align: [] }],

            ["link"],

            ["clean"]

        ]

    };
    ////////////////////////////////////////////////

    return (

        <div className="announcementContainer">

            <div className="announcementHeader">

                <div>

                    <h1>
                        CrickEdge Announcement
                    </h1>

                    <p className="subtitle">
                        Official match & tournament updates
                    </p>

                </div>

                {/* STEP 14 — Controlled search */}

                <input

                    className="searchBox"

                    placeholder="Search announcements..."

                    value={search}

                    onChange={e =>
                        setSearch(e.target.value)
                    }

                />

                {user?.role === "admin" && (

                    <button

                        className="createBtn"

                        onClick={openCreate}

                    >

                        Create Announcement

                    </button>

                )}

            </div>

////////////////////////////////////////////////

            // STEP 15 — Editor Modal

            {editorOpen && (

                <div className="editorModal">

                    <div className="editorBox">

                        <h2>

                            {editId ?
                                "Edit Announcement" :
                                "Create Announcement"}

                        </h2>

                        <input

                            className="titleInput"

                            placeholder="Title"

                            value={title}

                            onChange={e =>
                                setTitle(e.target.value)}

                        />

                        <select

                            value={category}

                            onChange={e =>
                                setCategory(e.target.value)}

                        >

                            <option>General</option>
                            <option>Tournament</option>
                            <option>Finance</option>
                            <option>System</option>

                        </select>

                        <label>

                            <input

                                type="checkbox"

                                checked={pinned}

                                onChange={e =>
                                    setPinned(e.target.checked)}

                            />

                            Pin to top

                        </label>

                        <ReactQuill

                            value={content}

                            onChange={setContent}

                            modules={modules}

                        />

                        <div className="editorActions">

                            <button onClick={submit}>
                                Post
                            </button>

                            <button
                                onClick={() =>
                                    setEditorOpen(false)
                                }
                            >
                                Cancel
                            </button>

                        </div>

                    </div>

                </div>

            )}

////////////////////////////////////////////////

            // STEP 16 — Announcement list

            <div className="announcementList">

                {/* STEP 17 — Empty states */}

                {filtered.length === 0 && (

                    <div className="emptyState">

                        {search ?

                            "No announcements found"

                            :

                            "No announcements yet. Admin updates will appear here."

                        }

                    </div>

                )}

                {filtered.map((a) => {

                    return (

                        <div

                            id={a.id}

                            key={a.id}

                            className={
                                a.is_pinned ?
                                    "announcementCard pinned" :
                                    "announcementCard"
                            }

                        >

                            {/* NEW badge */}

                            {a.is_new && (

                                <span className="newBadge">
                                    NEW
                                </span>

                            )}

                            {/* Pin icon */}

                            {a.is_pinned && (

                                <FaThumbtack
                                    className="pinIcon"
                                />

                            )}

                            {/* Title highlight */}

                            <h2>

                                <Highlighter

                                    searchWords={[search]}

                                    textToHighlight={a.title}

                                />

                            </h2>

                            <div className="meta">

                                <span>

                                    {format(
                                        new Date(a.created_at),
                                        "dd MMM yyyy HH:mm"
                                    )}

                                </span>

                                <span className={
                                    getCategoryClass(a.category)
                                }>
                                    {a.category}
                                </span>

                                <span>
                                    Views {a.views}
                                </span>

                            </div>

                            {/* STEP 18 — Content */}

                            <div

                                className="content"

                                dangerouslySetInnerHTML={{
                                    __html: a.content
                                }}

                            />

                            <div className="actions">

                                <button
                                    onClick={() =>
                                        shareWhatsApp(a.id)
                                    }
                                >

                                    <FaWhatsapp />
                                    Share

                                </button>

                                <button
                                    onClick={() =>
                                        copyLink(a.id)
                                    }
                                >

                                    <FaLink />
                                    Copy

                                </button>

                                {user?.role === "admin" && (

                                    <>

                                        <button
                                            onClick={() =>
                                                editAnnouncement(a)
                                            }
                                        >

                                            <FaEdit />
                                            Edit

                                        </button>

                                        <button
                                            onClick={() =>
                                                deleteAnnouncement(a.id)
                                            }
                                        >

                                            <FaTrash />
                                            Delete

                                        </button>

                                    </>

                                )}

                            </div>

                        </div>

                    );

                })}

            </div>

        </div>

    );

}

export default AnnouncementPage;