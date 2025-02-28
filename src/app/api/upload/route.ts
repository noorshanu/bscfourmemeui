// @ts-nocheck
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const memeWebAccess = req.headers.get('meme-web-access');
    
    // Debug logs
    console.log('Received request with headers:', {
      memeWebAccess: memeWebAccess ? 'present' : 'missing',
    });
    console.log('FormData entries:', Array.from(formData.entries()));

    if (!memeWebAccess) {
      return NextResponse.json(
        { error: 'Missing meme-web-access token' },
        { status: 400 }
      );
    }

    // Forward the request to the meme API
    const response = await fetch("https://four.meme/meme-api/v1/private/token/upload", {
      method: "POST",
      headers: {
        "accept": "application/json, text/plain, */*",
        "meme-web-access": memeWebAccess,
        "Referer": "https://four.meme/create-token",
      },
      body: formData
    });

    // Debug logs
    console.log('Meme API response status:', response.status);
    console.log('Meme API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed with status:', response.status);
      console.error('Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorJson.message || 'Failed to upload logo' },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { error: `Upload failed with status ${response.status}: ${errorText}` },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    console.log('Upload successful:', data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload logo' },
      { status: 500 }
    );
  }
}