<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import './AccountPage.css'

import profilePicture from '../../assets/Account/profile-user-account.svg'

const router = useRouter()

const isEditing = ref(false)

const fullName = ref('Isabella')
const email = ref('isabella@example.com')
const phoneNumber = ref('012-345-6789')

function goBack() {
  router.back()
}

function editProfile() {
  isEditing.value = true
}

function submitProfile() {
  isEditing.value = false
}
</script>

<template>
  <main class="account-page">

    <!-- Header -->
    <header class="account-page__header">

      <button
        class="account-page__back"
        type="button"
        aria-label="Go back"
        @click="goBack"
      >
        &lt;
      </button>

      <h1 class="account-page__title">
        Edit Profile
      </h1>

    </header>

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

          <span class="account-page__flag">
            🇲🇾
          </span>

          <input
            id="phone"
            v-model="phoneNumber"
            class="account-page__phone-input"
            type="tel"
            :readonly="!isEditing"
          />

        </div>

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

  </main>
</template>