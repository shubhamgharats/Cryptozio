import { useEffect, useState } from "react";

const API_KEY = import.meta.env.VITE_GIPHY_API;

const useFetch = ({ keyword }) => {
  const [gifUrl, setGifUrl] = useState("");

const fetchGifs = async () => {
  try {
    console.log("Searching Giphy for:", keyword);

    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${keyword}&limit=1`
    );

    const result = await response.json();
    console.log("Giphy result:", result);

    const { data } = result;

    if (data.length > 0) {
      setGifUrl(data[0].images.downsized.url);
    } else {
      console.log("No GIF found for keyword:", keyword);
      setGifUrl("https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif");
    }
  } catch (error) {
    console.log("Giphy error:", error);
  }
};

  useEffect(() => {
    if (keyword) fetchGifs();
  }, [keyword])
return gifUrl;
}

export default useFetch;