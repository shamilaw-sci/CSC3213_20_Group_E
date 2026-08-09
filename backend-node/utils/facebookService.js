const axios = require("axios");

/**
 * Service to handle automated postings to the Thirasara Facebook Page.
 */
class FacebookService {
  constructor() {
    this.pageId = process.env.FB_PAGE_ID;
    this.accessToken = process.env.FB_PAGE_ACCESS_TOKEN;
    this.frontendUrl =
      process.env.FRONTEND_URL || "https://thirasara-property.vercel.app";
    this.graphApiUrl = "https://graph.facebook.com/v19.0";
  }

  /**
   * Automatically post an approved property to the Facebook page.
   * @param {Object} property The property object from Supabase.
   */
  async postPropertyToFacebook(property) {
    if (!this.pageId || !this.accessToken) {
      console.log(
        "FB_PAGE_ID or FB_PAGE_ACCESS_TOKEN not set. Skipping Facebook post.",
      );
      return false;
    }

    try {
      console.log(`Starting FB Automation for property: ${property.id}`);

      // 1. Format the beautiful caption
      const message = this._formatCaption(property);

      // 2. Extract image URLs (take up to 4 images for a nice gallery)
      const imageUrls = [];
      if (property.images && Array.isArray(property.images)) {
        // Try to take up to 4 valid HTTP URLs
        const validUrls = property.images.filter(
          (url) => url.startsWith("http://") || url.startsWith("https://"),
        );
        imageUrls.push(...validUrls.slice(0, 4));
      }

      // 3. Upload images to Facebook (Unpublished)
      const attachedMedia = [];
      if (imageUrls.length > 0) {
        for (const url of imageUrls) {
          const photoId = await this._uploadUnpublishedPhoto(url);
          if (photoId) {
            attachedMedia.push({ media_fbid: photoId });
          }
        }
      }

      // 4. Create the final Feed Post
      if (attachedMedia.length > 0) {
        // Multi-image post
        await this._createMultiImagePost(message, attachedMedia);
      } else if (imageUrls.length === 1 && attachedMedia.length === 0) {
        // Fallback single image logic if multi failed but we have 1 image
        await this._createSingleImagePost(message, imageUrls[0]);
      } else {
        // Text-only post or link post (if no images)
        await this._createTextPost(message, property.id);
      }

      console.log(`Successfully posted property ${property.id} to Facebook.`);
      return true;
    } catch (error) {
      console.error(
        "Error posting to Facebook:",
        error.response?.data || error.message,
      );
      return false; // Don't crash the approval process if FB fails
    }
  }

  _formatCaption(property) {
    const title = property.title || "New Property Available";
    const location =
      property.city && property.district
        ? `${property.city}, ${property.district}`
        : property.city || property.district || "Sri Lanka";

    const price = Number(property.price).toLocaleString("en-US");
    const pricePeriod =
      property.price_period && property.price_period !== "none"
        ? ` / ${property.price_period}`
        : "";

    const bedrooms = property.bedrooms || 0;
    const bathrooms = property.bathrooms || 0;
    const houseSize = property.house_size || 0;
    const landSize = property.land_size || 0;

    const description = property.description
      ? property.description.substring(0, 150) + "..."
      : "";

    const link = `${this.frontendUrl}/properties/${property.id}`;

    // Clean up type and location for hashtags
    const typeHashtag = property.type
      ? `#${property.type.replace(/\s+/g, "")}`
      : "";
    const cityHashtag = property.city
      ? `#${property.city.replace(/\s+/g, "")}`
      : "";

    return `🚨 NEW PROPERTY ALERT! 🚨

🏡 ${title}
📍 Location: ${location}
💰 Price: Rs. ${price}${pricePeriod}

✨ Features:
🛏️ ${bedrooms} Bedrooms | 🛁 ${bathrooms} Bathrooms
📏 ${houseSize} sqft | 🌳 ${landSize} Perches

📝 Description:
${description}

🌐 View more details & contact the seller:
${link}

#ThirasaraProperties #RealEstate ${cityHashtag} ${typeHashtag} #SriLanka
`;
  }

  /**
   * Uploads an image to the page without publishing it. Returns the photo ID.
   */
  async _uploadUnpublishedPhoto(imageUrl) {
    try {
      const response = await axios.post(
        `${this.graphApiUrl}/${this.pageId}/photos`,
        {
          url: imageUrl,
          published: false, // Do not publish immediately, we will attach it to a feed post
          access_token: this.accessToken,
        },
      );
      return response.data.id;
    } catch (error) {
      console.error(
        "FB Photo Upload Error:",
        error.response?.data || error.message,
      );
      return null;
    }
  }

  /**
   * Creates a post with multiple images (Carousel/Gallery).
   */
  async _createMultiImagePost(message, attachedMedia) {
    // Construct attached_media object arrays for Facebook Graph API
    // e.g. attached_media[0]={"media_fbid":"id1"}
    const data = {
      message: message,
      access_token: this.accessToken,
    };

    attachedMedia.forEach((media, index) => {
      data[`attached_media[${index}]`] = JSON.stringify(media);
    });

    await axios.post(`${this.graphApiUrl}/${this.pageId}/feed`, data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  }

  /**
   * Fallback for a single image post.
   */
  async _createSingleImagePost(message, imageUrl) {
    await axios.post(`${this.graphApiUrl}/${this.pageId}/photos`, {
      url: imageUrl,
      message: message,
      access_token: this.accessToken,
    });
  }

  /**
   * Fallback for a text/link post.
   */
  async _createTextPost(message, propertyId) {
    const link = `${this.frontendUrl}/properties/${propertyId}`;
    await axios.post(`${this.graphApiUrl}/${this.pageId}/feed`, {
      message: message,
      link: link,
      access_token: this.accessToken,
    });
  }
}

module.exports = new FacebookService();
