import { Buffer } from "buffer";

const projectRef = "rdmypruvhkqvfdjfohpk";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbXlwcnV2aGtxdmZkamZvaHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNjk4MDUsImV4cCI6MjA5NTc0NTgwNX0.pscauFnFiUoMcvhwalfxfsjkfKVbU_p7NzuWtTLaAV4";
const bucketName = "carousel-images";

// We request WebP format, smaller dimensions (600px for hero/cards, 400px for stops), and compressed quality (70/65)
const imagesToUpload = {
  delhi: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=70&fm=webp",
  noida: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=70&fm=webp",
  jaipur: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=70&fm=webp",
  mussoorie: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=70&fm=webp",
  goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=70&fm=webp",
  cafe: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=65&fm=webp",
  market: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=400&q=65&fm=webp",
  sunset: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=65&fm=webp",
};

async function uploadImage(name: string, url: string) {
  console.log(`Downloading optimized WebP for ${name}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image from ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const filename = `${name}.webp`;
  const uploadUrl = `https://${projectRef}.supabase.co/storage/v1/object/${bucketName}/${filename}`;

  console.log(`Uploading ${filename} to Supabase Storage (${buffer.length} bytes)...`);
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "apikey": apiKey,
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "image/webp",
      "x-upsert": "true"
    },
    body: buffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Failed to upload ${filename} to Supabase: ${uploadResponse.statusText} - ${errorText}`);
  }

  const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/${bucketName}/${filename}`;
  console.log(`✅ Uploaded successfully! Public URL: ${publicUrl}`);
  return publicUrl;
}

async function main() {
  for (const [name, url] of Object.entries(imagesToUpload)) {
    try {
      await uploadImage(name, url);
    } catch (error) {
      console.error(`Error processing ${name}:`, error);
    }
  }
}

main();
