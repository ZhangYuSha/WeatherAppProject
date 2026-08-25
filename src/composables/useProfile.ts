import { ref } from 'vue'

export interface Profile {
  fullName: string
  email: string
  phoneNumber: string
  country: string
}

const STORAGE_KEY = 'userProfile'

const DEFAULT_PROFILE: Profile = {
  fullName: 'Isabella',
  email: 'isabella@example.com',
  phoneNumber: '012-345-6789',
  country: 'MY',
}

function loadProfile(): Profile {
  const savedProfile = localStorage.getItem(STORAGE_KEY)

  if (!savedProfile) {
    return { ...DEFAULT_PROFILE }
  }

  try {
    return {
      ...DEFAULT_PROFILE,
      ...JSON.parse(savedProfile),
    }
  } catch {
    return { ...DEFAULT_PROFILE }
  }
}

// Module-level shared state
const profile = ref<Profile>(loadProfile())

function saveProfile(updatedProfile: Profile) {
  profile.value = updatedProfile

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedProfile)
  )
}

export function useProfile() {
  return {
    profile,
    saveProfile,
  }
}