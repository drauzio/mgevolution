const {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} = require('@azure/storage-blob')

function getContainerClient() {
  const cs = process.env.AZURE_STORAGE_CONNECTION_STRING
  const containerName = process.env.AZURE_BLOB_CONTAINER
  if (!cs) throw new Error('AZURE_STORAGE_CONNECTION_STRING não definido')
  if (!containerName) throw new Error('AZURE_BLOB_CONTAINER não definido')
  const service = BlobServiceClient.fromConnectionString(cs)
  return service.getContainerClient(containerName)
}

async function uploadBuffer({ buffer, blobName, contentType }) {
  if (!buffer) throw new Error('uploadBuffer: buffer é obrigatório')
  if (!blobName) throw new Error('uploadBuffer: blobName é obrigatório')
  const container = getContainerClient()
  await container.createIfNotExists()
  const blob = container.getBlockBlobClient(blobName)
  await blob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType || 'application/octet-stream' },
  })
  return { filekey: blobName, url: blob.url }
}

async function gerarSasReadUrl(filekey, { minutes = 60 } = {}) {
  if (!filekey) throw new Error('gerarSasReadUrl: filekey é obrigatório')
  const cs = process.env.AZURE_STORAGE_CONNECTION_STRING
  const containerName = process.env.AZURE_BLOB_CONTAINER
  if (!cs) throw new Error('AZURE_STORAGE_CONNECTION_STRING não definido')
  if (!containerName) throw new Error('AZURE_BLOB_CONTAINER não definido')

  const accountMatch = cs.match(/AccountName=([^;]+)/)
  const keyMatch = cs.match(/AccountKey=([^;]+)/)
  if (!accountMatch || !keyMatch) throw new Error('Não foi possível extrair AccountName/AccountKey')

  const accountName = accountMatch[1]
  const accountKey = keyMatch[1]
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)

  const service = BlobServiceClient.fromConnectionString(cs)
  const container = service.getContainerClient(containerName)
  const blob = container.getBlobClient(filekey)

  const expiresOn = new Date(Date.now() + minutes * 60 * 1000)
  const sas = generateBlobSASQueryParameters(
    { containerName, blobName: filekey, permissions: BlobSASPermissions.parse('r'), expiresOn },
    sharedKeyCredential
  ).toString()

  return `${blob.url}?${sas}`
}

async function deleteBlob(filekey) {
  if (!filekey) return
  const container = getContainerClient()
  const blob = container.getBlockBlobClient(filekey)
  await blob.deleteIfExists()
}

module.exports = { uploadBuffer, gerarSasReadUrl, deleteBlob }
