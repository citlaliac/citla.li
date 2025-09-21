import { useEffect } from 'react';

/**
 * Custom hook for managing SEO meta tags
 * Updates document title, description, and other meta tags dynamically
 */
export const useSEO = ({ 
  title, 
  description, 
  keywords, 
  canonicalUrl, 
  ogTitle, 
  ogDescription, 
  ogImage,
  ogType = 'website',
  twitterTitle,
  twitterDescription,
  twitterImage,
  structuredData
}) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update meta description
    if (description) {
      updateMetaTag('name', 'description', description);
    }

    // Update meta keywords
    if (keywords) {
      updateMetaTag('name', 'keywords', keywords);
    }

    // Update canonical URL
    if (canonicalUrl) {
      updateCanonicalUrl(canonicalUrl);
    }

    // Update Open Graph tags
    if (ogTitle) {
      updateMetaTag('property', 'og:title', ogTitle);
    }
    if (ogDescription) {
      updateMetaTag('property', 'og:description', ogDescription);
    }
    if (ogImage) {
      updateMetaTag('property', 'og:image', ogImage);
    }
    if (ogType) {
      updateMetaTag('property', 'og:type', ogType);
    }

    // Update Twitter Card tags
    if (twitterTitle) {
      updateMetaTag('property', 'twitter:title', twitterTitle);
    }
    if (twitterDescription) {
      updateMetaTag('property', 'twitter:description', twitterDescription);
    }
    if (twitterImage) {
      updateMetaTag('property', 'twitter:image', twitterImage);
    }

    // Add structured data
    if (structuredData) {
      addStructuredData(structuredData);
    }

    // Cleanup function to remove structured data when component unmounts
    return () => {
      removeStructuredData();
    };
  }, [title, description, keywords, canonicalUrl, ogTitle, ogDescription, ogImage, ogType, twitterTitle, twitterDescription, twitterImage, structuredData]);
};

/**
 * Helper function to update or create meta tags
 */
const updateMetaTag = (attribute, value, content) => {
  let metaTag = document.querySelector(`meta[${attribute}="${value}"]`);
  
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute(attribute, value);
    document.head.appendChild(metaTag);
  }
  
  metaTag.setAttribute('content', content);
};

/**
 * Helper function to update canonical URL
 */
const updateCanonicalUrl = (url) => {
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  
  canonicalLink.setAttribute('href', url);
};

/**
 * Helper function to add structured data
 */
const addStructuredData = (data) => {
  // Remove existing structured data
  removeStructuredData();
  
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  script.id = 'structured-data';
  document.head.appendChild(script);
};

/**
 * Helper function to remove structured data
 */
const removeStructuredData = () => {
  const existingScript = document.getElementById('structured-data');
  if (existingScript) {
    existingScript.remove();
  }
};
