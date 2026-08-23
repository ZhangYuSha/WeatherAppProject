<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import './AccountPage.css'

import PageWithBackButton from '../../components/templates/PageWithBackButton/PageWithBackButton.vue'

import profilePicture from '../../assets/Account/profile-user-account.svg'

import { getCountries } from '../../services/CountryApi'
import type { Country } from '../../services/CountryApi'

const isEditing = ref(false)

const fullName = ref('Isabella')
const email = ref('isabella@example.com')
const phoneNumber = ref('012-345-6789')

const countries = ref<Country[]>([])
const selectedCountry = ref('MY')
const countryLoading = ref(false)
const countryError = ref('')

function editProfile() {
  isEditing.value = true
}

function submitProfile() {
  isEditing.value = false
}

const selectedCountryData = computed(() => {
  return countries.value.find(
    (country) =>
      country.code === selectedCountry.value
  )
})

function getFlagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`
}

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
          type="text"
          :readonly="!isEditing"
        />

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
          type="email"
          :readonly="!isEditing"
        />

      </div>

      <!-- Phone -->
      <div class="account-page__field">

        <label for="phone">
          Phone number:
        </label>

        <div class="account-page__phone-wrapper">

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
          />

        </div>

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