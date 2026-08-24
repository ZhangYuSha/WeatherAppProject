<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import './AccountPage.css'

import PageWithBackButton from '../../components/templates/PageWithBackButton/PageWithBackButton.vue'

import profilePicture from '../../assets/Account/profile-user-account.svg'

import { getCountries } from '../../services/CountryApi'
import type { Country } from '../../services/CountryApi'

// Toggles between read-only "summary" view and editable form view.
// Inputs use :readonly bound to !isEditing rather than v-if, so the
// same elements stay mounted and their v-model state is preserved.
const isEditing = ref(false)

const fullName = ref('Isabella')
const email = ref('isabella@example.com')
const phoneNumber = ref('012-345-6789')

// Per-field validation error messages. Empty string means the
// field is currently valid (or hasn't been validated yet).
const fullNameError = ref('')
const emailError = ref('')
const phoneNumberError = ref('')

const countries = ref<Country[]>([])
const selectedCountry = ref('MY')
const countryLoading = ref(false)
const countryError = ref('')

const FULL_NAME_MAX_LENGTH = 60
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9+\-\s]{7,15}$/

// Validates full name and sets/clears fullNameError as a side effect.
// Returns a boolean so callers (validateForm) can combine results
// without re-deriving validity from the error string.
function validateFullName(): boolean {
  const value = fullName.value.trim()

  if (!value) {
    fullNameError.value = 'Full name is required.'
    return false
  }

  if (value.length > FULL_NAME_MAX_LENGTH) {
    fullNameError.value = `Full name must be ${FULL_NAME_MAX_LENGTH} characters or fewer.`
    return false
  }

  fullNameError.value = ''
  return true
}

// Validates email format against EMAIL_PATTERN and sets/clears emailError.
function validateEmail(): boolean {
  const value = email.value.trim()

  if (!value) {
    emailError.value = 'Email is required.'
    return false
  }

  if (!EMAIL_PATTERN.test(value)) {
    emailError.value = 'Enter a valid email address.'
    return false
  }

  emailError.value = ''
  return true
}

// Validates phone number format against PHONE_PATTERN and sets/clears
// phoneNumberError. Note: this only checks the number itself, not
// selectedCountry — country code isn't factored into validation.
function validatePhoneNumber(): boolean {
  const value = phoneNumber.value.trim()

  if (!value) {
    phoneNumberError.value = 'Phone number is required.'
    return false
  }

  if (!PHONE_PATTERN.test(value)) {
    phoneNumberError.value = 'Enter a valid phone number.'
    return false
  }

  phoneNumberError.value = ''
  return true
}

// Runs all field validators before submit.
function validateForm(): boolean {
  // Run all three so every invalid field shows its own message,
  // rather than short-circuiting on the first failure.
  const isFullNameValid = validateFullName()
  const isEmailValid = validateEmail()
  const isPhoneNumberValid = validatePhoneNumber()

  return isFullNameValid && isEmailValid && isPhoneNumberValid
}

// Switches the form into editable mode.
function editProfile() {
  isEditing.value = true
}

// Validates the form and, if valid, exits edit mode (treated as "save").
// Fields stay populated with whatever the user typed either way; there's
// no revert-on-cancel path since there's no explicit cancel button.
function submitProfile() {
  if (!validateForm()) {
    return
  }

  isEditing.value = false
}

// Looks up the full Country record for the currently selected code,
// used to resolve the flag image and display name.
const selectedCountryData = computed(() => {
  return countries.value.find(
    (country) =>
      country.code === selectedCountry.value
  )
})

// Builds a flag image URL from a country code via the flagcdn service.
function getFlagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`
}

// Fetches the country list once on mount to populate the dropdown.
// selectedCountry defaults to 'MY' independently of this fetch, so the
// select will show the right value as soon as countries load (assuming
// 'MY' exists in the returned list).
onMounted(async () => {
  countryLoading.value = true
  countryError.value = ''

  try {
    countries.value = await getCountries()
  } catch (error) {
    console.error(
      'Failed to load countries:',
      error
    )

    countryError.value =
      'Unable to load countries.'
  } finally {
    countryLoading.value = false
  }
})
</script>

<template>
  <PageWithBackButton class="account-page" title="Edit Profile">
    <!-- Profile summary -->
    <section class="account-page__profile">

      <img
        class="account-page__profile-picture"
        :src="profilePicture"
        alt="Profile picture"
      />

      <h2 class="account-page__name">
        {{ fullName }}
      </h2>

      <p class="account-page__contact">
        {{ email }} | {{ phoneNumber }}
      </p>

    </section>

    <!-- Profile information -->
    <section class="account-page__form">

      <!-- Full name -->
      <div class="account-page__field">

        <label for="full-name">
          Full name:
        </label>

        <input
          id="full-name"
          v-model="fullName"
          class="account-page__input"
          :class="{ 'account-page__input--invalid': fullNameError }"
          type="text"
          :readonly="!isEditing"
          :aria-invalid="!!fullNameError"
          :maxlength="FULL_NAME_MAX_LENGTH"
          @blur="isEditing && validateFullName()"
        />

        <p
          v-if="fullNameError"
          class="account-page__field-error"
          role="alert"
        >
          {{ fullNameError }}
        </p>

      </div>

      <!-- Email -->
      <div class="account-page__field">

        <label for="email">
          Email:
        </label>

        <input
          id="email"
          v-model="email"
          class="account-page__input"
          :class="{ 'account-page__input--invalid': emailError }"
          type="email"
          :readonly="!isEditing"
          :aria-invalid="!!emailError"
          @blur="isEditing && validateEmail()"
        />

        <p
          v-if="emailError"
          class="account-page__field-error"
          role="alert"
        >
          {{ emailError }}
        </p>

      </div>

      <!-- Phone -->
      <div class="account-page__field">

        <label for="phone">
          Phone number:
        </label>

        <div
          class="account-page__phone-wrapper"
          :class="{ 'account-page__phone-wrapper--invalid': phoneNumberError }"
        >

          <!-- Country dropdown -->
          <select
            v-model="selectedCountry"
            class="account-page__country"
            :disabled="
              !isEditing ||
              countryLoading
            "
            aria-label="Country"
          >

            <option
              v-for="country in countries"
              :key="country.code"
              :value="country.code"
            >
              {{ country.name }}
            </option>

          </select>

          <!-- Country flag -->
          <img
            v-if="selectedCountryData"
            class="account-page__flag"
            :src="
              getFlagUrl(
                selectedCountryData.code
              )
            "
            :alt="
              `${selectedCountryData.name} flag`
            "
          />

          <input
            id="phone"
            v-model="phoneNumber"
            class="account-page__phone-input"
            type="tel"
            :readonly="!isEditing"
            :aria-invalid="!!phoneNumberError"
            @blur="isEditing && validatePhoneNumber()"
          />

        </div>

        <p
          v-if="phoneNumberError"
          class="account-page__field-error"
          role="alert"
        >
          {{ phoneNumberError }}
        </p>

        <p
          v-if="countryLoading"
          class="account-page__country-status"
        >
          Loading countries...
        </p>

        <p
          v-if="countryError"
          class="account-page__error"
        >
          {{ countryError }}
        </p>

      </div>

      <!-- Action button -->
      <div class="account-page__actions">

        <button
          v-if="!isEditing"
          class="account-page__button"
          type="button"
          @click="editProfile"
        >
          Edit
        </button>

        <button
          v-else
          class="account-page__button"
          type="button"
          @click="submitProfile"
        >
          Submit
        </button>

      </div>

    </section>
  </PageWithBackButton>
</template>