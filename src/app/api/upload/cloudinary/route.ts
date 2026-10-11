import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, folder, cloudName, uploadPreset, apiKey, apiSecret } = body;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const cName = cloudName || process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const aKey = apiKey || process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const aSecret = apiSecret || process.env.CLOUDINARY_API_SECRET;
    const preset = uploadPreset || process.env.CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cName) {
      return NextResponse.json(
        { error: 'Cloudinary cloud name is not configured' },
        { status: 400 }
      );
    }

    // Configure Cloudinary SDK if API key and secret exist
    if (aKey && aSecret) {
      cloudinary.config({
        cloud_name: cName,
        api_key: aKey,
        api_secret: aSecret,
        secure: true,
      });

      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: folder || 'irshad-school-cms',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });

      return NextResponse.json({
        url: uploadResponse.secure_url,
        public_id: uploadResponse.public_id,
        format: uploadResponse.format,
        width: uploadResponse.width,
        height: uploadResponse.height,
      });
    }

    // If unsigned preset is available
    if (preset) {
      const formData = new FormData();
      formData.append('file', image);
      formData.append('upload_preset', preset);
      formData.append('folder', folder || 'irshad-school-cms');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const json = await response.json();
        return NextResponse.json({
          url: json.secure_url,
          public_id: json.public_id,
        });
      } else {
        const errText = await response.text();
        return NextResponse.json(
          { error: `Cloudinary unsigned upload failed: ${errText}` },
          { status: response.status }
        );
      }
    }

    return NextResponse.json(
      { error: 'Missing Cloudinary API Key / Secret or Upload Preset' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Cloudinary API upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Server upload failed' },
      { status: 500 }
    );
  }
}
