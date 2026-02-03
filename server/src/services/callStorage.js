// In-memory storage for pending calls
// This solves the iOS Safari notification issue where socket events are missed

const pendingCalls = new Map();
const pendingOffers = new Map();
const TTL = 5 * 60 * 1000; // 5 minutes

export const storePendingCall = (qrCodeId, callData) => {
  console.log(`💾 Storing pending call for ${qrCodeId}`);
  pendingCalls.set(qrCodeId, {
    ...callData,
    storedAt: Date.now()
  });
  
  // Auto-cleanup after TTL
  setTimeout(() => {
    if (pendingCalls.has(qrCodeId)) {
      console.log(`🧹 Auto-cleaning expired pending call for ${qrCodeId}`);
      pendingCalls.delete(qrCodeId);
    }
  }, TTL);
};

export const storePendingOffer = (qrCodeId, offer) => {
  console.log(`💾 Storing pending offer for ${qrCodeId}`);
  pendingOffers.set(qrCodeId, {
    offer,
    storedAt: Date.now()
  });
  
  // Auto-cleanup after TTL
  setTimeout(() => {
    if (pendingOffers.has(qrCodeId)) {
      console.log(`🧹 Auto-cleaning expired pending offer for ${qrCodeId}`);
      pendingOffers.delete(qrCodeId);
    }
  }, TTL);
};

export const getPendingCall = (qrCodeId) => {
  const callData = pendingCalls.get(qrCodeId);
  
  if (!callData) {
    console.log(`❌ No pending call found for ${qrCodeId}`);
    return null;
  }
  
  // Check if expired
  const age = Date.now() - callData.storedAt;
  if (age > TTL) {
    console.log(`⚠️ Pending call for ${qrCodeId} expired (age: ${Math.round(age/1000)}s)`);
    pendingCalls.delete(qrCodeId);
    return null;
  }
  
  console.log(`✅ Found pending call for ${qrCodeId} (age: ${Math.round(age/1000)}s)`);
  return {
    ...callData,
    offer: pendingOffers.get(qrCodeId)?.offer || null
  };
};

export const clearPendingCall = (qrCodeId) => {
  console.log(`🗑️ Clearing pending call for ${qrCodeId}`);
  pendingCalls.delete(qrCodeId);
  pendingOffers.delete(qrCodeId);
};

export const getPendingCallsStats = () => {
  return {
    totalCalls: pendingCalls.size,
    totalOffers: pendingOffers.size,
    calls: Array.from(pendingCalls.keys())
  };
};
