// Azure Blob Storage configuration from environment variables
const STORAGE_ACCOUNT = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT || 'dataexc';
const CONTAINER_NAME = import.meta.env.VITE_AZURE_CONTAINER_NAME || 'lifeinsurance';
const ACCOUNT_KEY = import.meta.env.VITE_AZURE_ACCOUNT_KEY || '';

// Validate that credentials are available
if (!ACCOUNT_KEY) {
  console.warn('Azure Storage Account Key not found in environment variables. SAS token generation will fail.');
}

export interface BlobDocument {
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'other';
  size: number;
  lastModified: Date;
}

/**
 * Get the base URL for the blob storage
 */
function getBlobBaseUrl(): string {
  return `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINER_NAME}`;
}

/**
 * Generate HMAC-SHA256 signature for SAS token
 */
async function generateSignature(stringToSign: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = Uint8Array.from(atob(key), c => c.charCodeAt(0));
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    algorithm,
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    algorithm.name,
    cryptoKey,
    encoder.encode(stringToSign)
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Generate SAS token for container or blob
 */
async function generateSasToken(): Promise<string> {
  const now = new Date();
  const start = new Date(now.getTime() - 5 * 60000); // 5 minutes ago
  const expiry = new Date(now.getTime() + 60 * 60000); // 1 hour from now
  
  // Format dates as YYYY-MM-DDTHH:mm:ssZ
  const startStr = start.toISOString().split('.')[0] + 'Z';
  const expiryStr = expiry.toISOString().split('.')[0] + 'Z';
  
  const signedVersion = '2021-08-06';
  const signedServices = 'b'; // blob
  const signedResourceTypes = 'sco'; // service, container, object
  const signedPermissions = 'rl'; // read and list
  const signedProtocol = 'https';
  
  // Account SAS string to sign format
  const stringToSign = [
    STORAGE_ACCOUNT,
    signedPermissions,
    signedServices,
    signedResourceTypes,
    startStr,
    expiryStr,
    '', // signedIP
    signedProtocol,
    signedVersion,
    '', // signedEncryptionScope
  ].join('\n');
  
  console.log('String to sign:', stringToSign.replace(/\n/g, '\\n'));
  
  const signature = await generateSignature(stringToSign, ACCOUNT_KEY);
  
  const sasParams = new URLSearchParams({
    sv: signedVersion,
    ss: signedServices,
    srt: signedResourceTypes,
    sp: signedPermissions,
    se: expiryStr,
    st: startStr,
    spr: signedProtocol,
    sig: signature,
  });
  
  return sasParams.toString();
}

/**
 * List all blobs in a specific directory using REST API
 */
export async function listDocuments(applicationId: string): Promise<BlobDocument[]> {
  try {
    // Documents are stored in the '001' directory, not per application ID
    const prefix = '001';
    const baseUrl = getBlobBaseUrl();
    
    // Try without authentication first (public access)
    let listUrl = `${baseUrl}?restype=container&comp=list&prefix=${encodeURIComponent(prefix)}`;
    
    console.log('Attempting public access first...');
    console.log('Fetching documents from:', listUrl);
    console.log('Application ID:', applicationId);
    console.log('Using fixed directory prefix:', prefix);
    
    let response = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'x-ms-version': '2021-08-06',
      },
      mode: 'cors',
    });

    console.log('Public access response status:', response.status);

    // If public access failed (401 or 403), try with SAS token
    if (!response.ok && (response.status === 401 || response.status === 403)) {
      console.log('Public access failed, trying with SAS token...');
      const sasToken = await generateSasToken();
      listUrl = `${baseUrl}?restype=container&comp=list&prefix=${encodeURIComponent(prefix)}&${sasToken}`;
      console.log('Fetching with SAS token:', listUrl.split('&sig=')[0] + '&sig=***');
      
      response = await fetch(listUrl, {
        method: 'GET',
        headers: {
          'x-ms-version': '2021-08-06',
        },
        mode: 'cors',
      });
      
      console.log('SAS token response status:', response.status);
    }

    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to list blobs:', response.status, response.statusText, errorText);
      throw new Error(`Failed to list documents: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log('Received XML response, length:', xmlText.length);
    
    // Parse XML response
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for XML parsing errors
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      console.error('XML parsing error:', parserError[0].textContent);
      throw new Error('Failed to parse blob list response');
    }
    
    const blobs = xmlDoc.getElementsByTagName('Blob');
    console.log('Found blobs count:', blobs.length);
    const documents: BlobDocument[] = [];

    // Generate SAS token for blob access if needed
    const useSasToken = response.url.includes('sig=');
    const blobSasToken = useSasToken ? await generateSasToken() : '';

    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i];
      const nameElement = blob.getElementsByTagName('Name')[0];
      const propertiesElement = blob.getElementsByTagName('Properties')[0];
      
      if (!nameElement || !propertiesElement) continue;
      
      const fullName = nameElement.textContent || '';
      // Remove '001/' or '001' prefix to get just the filename
      const fileName = fullName.startsWith('001/') 
        ? fullName.substring(4) 
        : fullName.startsWith('001') 
        ? fullName.substring(3) 
        : fullName;
      
      console.log(`Processing blob ${i + 1}:`, fullName, '-> display name:', fileName);
      
      // Get blob properties
      const contentLengthElement = propertiesElement.getElementsByTagName('Content-Length')[0];
      const lastModifiedElement = propertiesElement.getElementsByTagName('Last-Modified')[0];
      
      const size = parseInt(contentLengthElement?.textContent || '0');
      const lastModified = lastModifiedElement?.textContent 
        ? new Date(lastModifiedElement.textContent) 
        : new Date();

      // Determine file type
      const extension = fullName.split('.').pop()?.toLowerCase() || '';
      let type: 'image' | 'pdf' | 'other' = 'other';
      
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
        type = 'image';
      } else if (extension === 'pdf') {
        type = 'pdf';
      }

      // Construct blob URL with SAS token if needed
      const blobUrl = useSasToken 
        ? `${baseUrl}/${encodeURIComponent(fullName)}?${blobSasToken}`
        : `${baseUrl}/${encodeURIComponent(fullName)}`;

      documents.push({
        name: fileName,
        url: blobUrl,
        type,
        size,
        lastModified,
      });
    }

    console.log(`Successfully processed ${documents.length} documents`);
    return documents;
  } catch (error: any) {
    console.error('Error listing documents:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
}

/**
 * Download a blob as a data URL (for CORS-restricted scenarios)
 */
export async function downloadBlobAsDataUrl(blobUrl: string): Promise<string> {
  try {
    const response = await fetch(blobUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.statusText}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error downloading blob:', error);
    throw error;
  }
}

/**
 * Check if a directory exists in the container
 */
export async function checkDirectoryExists(applicationId: string): Promise<boolean> {
  try {
    const documents = await listDocuments(applicationId);
    return documents.length > 0;
  } catch (error) {
    console.error('Error checking directory:', error);
    return false;
  }
}
