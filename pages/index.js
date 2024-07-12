import axios from "axios";
import { useState } from "react";

export default function Home() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("");
  const [urlsToDelete, setUrlsToDelete] = useState([]);
  const [newUrl, setNewUrl] = useState("");

  const [wordpressUrl, setWordpressUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleDeletePosts = async () => {
    if (!wordpressUrl || !username || !password) {
      setDeleteStatus(
        "Please enter WordPress site URL, username, and password."
      );
      return;
    }
    setIsDeleting(true);
    setDeleteStatus("");
    await deleteWordpressPosts(urlsToDelete);
    setIsDeleting(false);
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    if (newUrl) {
      const newUrls = newUrl.split("\n").filter((url) => url.trim() !== "");
      setUrlsToDelete([...urlsToDelete, ...newUrls]);
      setNewUrl("");
    }
  };

  const handleRemoveUrl = (index) => {
    setUrlsToDelete(urlsToDelete.filter((_, i) => i !== index));
  };

  const getWordpressToken = async () => {
    const response = await axios.post(
      `${wordpressUrl}/wp-json/jwt-auth/v1/token`,
      { username, password },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data.token;
  };

  const deleteWordpressPosts = async (urls) => {
    const token = await getWordpressToken();

    for (const url of urls) {
      try {
        // 1. Get post ID from URL
        const postIdResponse = await axios.get(
          `${wordpressUrl}/wp-json/wp/v2/posts?slug=${
            url.split("/").slice(-2, -1)[0]
          }`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (postIdResponse.data.length === 0) {
          setDeleteStatus((prev) => prev + `Post not found for URL: ${url}\n`);
          continue;
        }

        const postId = postIdResponse.data[0].id;

        // 2. Delete the post
        await axios.delete(`${wordpressUrl}/wp-json/wp/v2/posts/${postId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setDeleteStatus((prev) => prev + `Successfully deleted post: ${url}\n`);
      } catch (error) {
        setDeleteStatus(
          (prev) => prev + `Error deleting post ${url}: ${error.message}\n`
        );
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="container mx-auto p-4 max-w-2xl">
        <h1 className="text-4xl font-bold mb-6">WordPress Content Pruner</h1>
        <p className="mb-6 text-lg text-gray-700">
          This tool allows you to delete blogs in bulk. Enter URLs to delete,
          your WordPress API keys, and click submit.
        </p>

        <p className="mb-6 text-lg text-gray-700">
          You will need the{" "}
          <a
            href="https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/#installation"
            className="text-blue-500 underline"
          >
            JWT Authentication for WP REST API
          </a>{" "}
          plugin for this to work.
        </p>
        <div className="mb-6 space-y-4">
          <input
            type="text"
            value={wordpressUrl}
            onChange={(e) => setWordpressUrl(e.target.value)}
            placeholder="WordPress Site URL"
            className="w-full p-3 border rounded"
          />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="WordPress Username"
            className="w-full p-3 border rounded"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="WordPress Password"
            className="w-full p-3 border rounded"
          />
        </div>
        <form onSubmit={handleAddUrl} className="mb-6">
          <textarea
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Enter URLs to delete (one per line)"
            className="w-full p-3 border rounded mb-3 h-32"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded"
          >
            Add URLs
          </button>
        </form>
        <ul className="mb-6 space-y-3">
          {urlsToDelete.map((url, index) => (
            <li
              key={index}
              className="flex justify-between items-center bg-gray-200 p-3 rounded"
            >
              <span className="truncate mr-3">{url}</span>
              <button
                onClick={() => handleRemoveUrl(index)}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={handleDeletePosts}
          disabled={isDeleting}
          className={`w-full bg-green-600 text-white p-3 rounded ${
            isDeleting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isDeleting ? "Deleting..." : "Delete Posts"}
        </button>
        {deleteStatus && (
          <pre className="mt-6 p-3 bg-gray-200 rounded text-lg overflow-x-auto">
            {deleteStatus}
          </pre>
        )}
      </div>
    </main>
  );
}
