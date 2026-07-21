<template>
  <NoticeArchiveView v-if="isNoticeArchive" />
  <template v-else>
    <!-- Top Bar -->
    <div class="bg-bdGreen-900 text-white text-sm py-1.5 relative z-50">
      <div
        class="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2"
      >
        <div class="flex items-center gap-4 flex-wrap">
          <span class="flex items-center gap-1.5"
            ><i class="fas fa-phone text-xs text-bdGreen-300"></i>
            {{ schoolSettings.phone }}</span
          >
          <span class="flex items-center gap-1.5"
            ><i class="fas fa-envelope text-xs text-bdGreen-300"></i>
            {{ schoolSettings.email }}</span
          >
          <span class="hidden md:flex items-center gap-1.5"
            ><i class="fas fa-id-card text-xs text-bdGreen-300"></i> EIIN:
            {{ schoolSettings.eiin }}</span
          >
        </div>
        <div class="flex items-center gap-3">
          <a href="#" class="hover:text-gold-400 transition-colors"
            ><i class="fab fa-facebook-f"></i
          ></a>
          <a href="#" class="hover:text-gold-400 transition-colors"
            ><i class="fab fa-youtube"></i
          ></a>
          <a href="#" class="hover:text-gold-400 transition-colors"
            ><i class="fab fa-twitter"></i
          ></a>
          <a
            :href="adminLoginUrl"
            class="ml-2 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-xs font-bold transition-colors"
          >
            <i class="fas fa-user-shield"></i> Admin
          </a>
          <button
            @click="toggleDark"
            class="ml-2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <i :class="isDark ? 'fas fa-sun text-gold-400' : 'fas fa-moon'"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Breaking News Marquee -->
    <div class="bg-bdRed-600 text-white py-1 relative z-50">
      <div class="max-w-7xl mx-auto px-4 flex items-center gap-3">
        <span
          class="bg-white text-bdRed-600 text-xs font-bold px-2 py-0.5 rounded shrink-0 uppercase tracking-wider"
          >ব্রেকিং</span
        >
        <div class="marquee-container flex-1">
          <span class="anim-marquee inline-block text-sm">
            {{ breakingNews }}
          </span>
        </div>
      </div>
    </div>

    <!-- Header -->
    <header
      class="bg-white shadow-md sticky top-0 z-40 transition-shadow duration-300"
      :class="{ 'shadow-2xl': scrolled }"
    >
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between gap-4">
          <!-- Logo Area -->
          <div class="flex items-center gap-3 shrink-0">
            <div
              class="w-16 h-16 md:w-20 md:h-20 rounded-full bg-bdGreen-50 border-2 border-bdGreen-500 p-1 anim-pulse-green"
            >
              <img
                src="/logo.png"
                alt="জাতীয় প্রতীক"
                class="w-full h-full object-contain rounded-full"
                onerror="this.style.display = 'none'"
              />
            </div>
            <div class="leading-tight">
              <h1 class="text-lg md:text-2xl font-bold text-bdGreen-800">
                {{ schoolSettings.name_bn }}
              </h1>
              <p class="text-xs md:text-sm text-gray-500 font-en">
                {{ schoolSettings.name_en }}
              </p>
              <p class="text-xs text-bdRed-600 font-medium hidden sm:block">
                {{ schoolSettings.address }} | EIIN: {{ schoolSettings.eiin }}
              </p>
            </div>
          </div>

          <!-- Desktop Nav -->
          <nav class="hidden lg:flex items-center gap-1">
            <a
              v-for="item in navItems"
              :key="item.id"
              :href="'#' + item.id"
              class="nav-link px-3 py-2 text-sm font-medium text-gray-700 hover:text-bdGreen-600 transition-colors"
              :class="{ 'active text-bdGreen-600': activeSection === item.id }"
            >
              {{ item.label }}
            </a>
          </nav>

          <!-- CTA + Mobile Toggle -->
          <div class="flex items-center gap-3">
            <button
              @click="showAdmissionModal = true"
              class="hidden md:flex items-center gap-2 bg-bdGreen-600 hover:bg-bdGreen-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-bdGreen-600/25"
            >
              <i class="fas fa-pen-to-square"></i> অনলাইন আবেদন
            </button>
            <button
              @click="mobileMenu = !mobileMenu"
              class="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <i
                :class="
                  mobileMenu
                    ? 'fas fa-times text-bdRed-500'
                    : 'fas fa-bars text-bdGreen-700'
                "
                class="text-xl"
              ></i>
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <transition name="slide">
          <div
            v-if="mobileMenu"
            class="lg:hidden mt-4 pb-4 border-t border-gray-100 pt-4 grid grid-cols-2 gap-2"
          >
            <a
              v-for="item in navItems"
              :key="item.id"
              :href="'#' + item.id"
              @click="mobileMenu = false"
              class="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-bdGreen-50 hover:text-bdGreen-700 transition-all text-center"
            >
              {{ item.label }}
            </a>
            <button
              @click="
                showAdmissionModal = true;
                mobileMenu = false;
              "
              class="col-span-2 bg-bdGreen-600 text-white py-2.5 rounded-lg text-sm font-medium mt-2"
            >
              <i class="fas fa-pen-to-square mr-2"></i>অনলাইন আবেদন
            </button>
          </div>
        </transition>
      </div>
    </header>

    <!-- Hero Section -->
    <section id="home" class="hero-bg min-h-[85vh] flex items-center relative">
      <div class="max-w-7xl mx-auto px-4 py-20 relative z-10 w-full">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div class="text-white">
            <div
              class="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm mb-6 anim-fade"
            >
              <span
                class="w-2 h-2 bg-green-400 rounded-full animate-pulse"
              ></span>
              ইসলামি ও আধুনিক শিক্ষার সমন্বয় | প্রতিষ্ঠিত: ১ জানুয়ারি ১৯৪৯
            </div>
            <h2
              class="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 anim-slide-up"
            >
              জ্ঞানের আলোয়<br />
              <span class="text-gold-400">আলোকিত সমাজ</span>
            </h2>
            <p
              class="text-lg text-green-100 mb-8 max-w-lg leading-relaxed anim-slide-up"
              style="animation-delay: 0.2s"
            >
              ১৯৪৯ সাল থেকে {{ schoolSettings.name_bn }} ইসলামি মূল্যবোধ, নৈতিক
              শিক্ষা ও আধুনিক পাঠক্রমের সমন্বয়ে শিক্ষার্থীদের মানসম্মত শিক্ষা
              প্রদান করে আসছে।
            </p>
            <div
              class="flex flex-wrap gap-4 anim-slide-up"
              style="animation-delay: 0.4s"
            >
              <a
                href="#admission"
                class="flex items-center gap-2 bg-white text-bdGreen-800 px-6 py-3 rounded-xl font-bold hover:bg-gold-400 hover:text-bdGreen-900 transition-all shadow-lg hover:shadow-xl"
              >
                <i class="fas fa-graduation-cap"></i> ভর্তি তথ্য
              </a>
              <a
                href="#results"
                class="flex items-center gap-2 glass text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
              >
                <i class="fas fa-chart-bar"></i> ফলাফল দেখুন
              </a>
            </div>
            <!-- Quick Stats -->
            <div
              class="grid grid-cols-3 gap-4 mt-12 anim-slide-up"
              style="animation-delay: 0.6s"
            >
              <div
                v-for="(stat, i) in quickStats"
                :key="i"
                class="text-center glass rounded-xl py-4 px-2"
              >
                <div class="text-3xl md:text-4xl font-black text-gold-400">
                  {{ stat.value }}
                </div>
                <div class="text-xs text-green-200 mt-1">{{ stat.label }}</div>
              </div>
            </div>
          </div>
          <div class="hidden lg:block relative">
            <div class="relative">
              <div
                class="w-80 h-80 mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 anim-float"
              >
                <img
                  src="https://picsum.photos/seed/bdschool1/640/640.jpg"
                  alt="প্রতিষ্ঠান"
                  class="w-full h-full object-cover"
                />
              </div>
              <!-- Floating Cards -->
              <div
                class="absolute -top-4 -right-4 glass-white rounded-2xl p-4 shadow-xl anim-float"
                style="animation-delay: 0.5s"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-bdGreen-100 rounded-full flex items-center justify-center"
                  >
                    <i class="fas fa-trophy text-bdGreen-600"></i>
                  </div>
                  <div>
                    <div class="text-sm font-bold text-gray-800">
                      মাদরাসা পরিচিতি
                    </div>
                    <div class="text-xs text-gray-500">
                      EIIN {{ schoolSettings.eiin }}
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="absolute -bottom-4 -left-4 glass-white rounded-2xl p-4 shadow-xl anim-float"
                style="animation-delay: 1s"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-bdRed-100 rounded-full flex items-center justify-center"
                  >
                    <i class="fas fa-medal text-bdRed-600"></i>
                  </div>
                  <div>
                    <div class="text-sm font-bold text-gray-800">
                      দাখিল পাশের হার
                    </div>
                    <div class="text-xs text-bdGreen-600 font-bold">৯৮.৫%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Government Compliance Banner -->
    <div class="bg-white border-b">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div
          class="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-gray-500"
        >
          <span class="flex items-center gap-2"
            ><i class="fas fa-check-circle text-bdGreen-500"></i> সরকারি স্বীকৃত
            শিক্ষা প্রতিষ্ঠান</span
          >
          <span class="flex items-center gap-2"
            ><i class="fas fa-check-circle text-bdGreen-500"></i>
            এমপিওভুক্ত</span
          >
          <span class="flex items-center gap-2"
            ><i class="fas fa-check-circle text-bdGreen-500"></i> ময়মনসিংহ
            বিভাগ</span
          >
          <span class="flex items-center gap-2"
            ><i class="fas fa-check-circle text-bdGreen-500"></i> মাদরাসা শিক্ষা
            পাঠ্যক্রম</span
          >
        </div>
      </div>
    </div>

    <!-- Notice Board & Events -->
    <section id="notice" class="py-20 bg-gray-50 section-reveal">
      <div class="max-w-7xl mx-auto px-4">
        <div class="text-center mb-14">
          <span
            class="inline-block bg-bdGreen-100 text-bdGreen-700 text-sm font-semibold px-4 py-1 rounded-full mb-4"
            >নোটিশ বোর্ড</span
          >
          <h2 class="text-3xl md:text-4xl font-black text-gray-800">
            সর্বশেষ বিজ্ঞপ্তি ও নোটিশ
          </h2>
          <p class="text-gray-500 mt-3">
            সকল সরকারি বিজ্ঞপ্তি এখানে প্রকাশ করা হয়
          </p>
        </div>
        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Notice List -->
          <div
            class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div
              class="flex flex-wrap items-center justify-between gap-3 bg-bdGreen-600 text-white px-6 py-3"
            >
              <h3 class="font-bold flex items-center gap-2">
                <i class="fas fa-bullhorn"></i> নোটিশ বোর্ড
              </h3>
              <div class="flex gap-2">
                <button
                  v-for="f in noticeFilters"
                  :key="f"
                  @click="noticeFilter = f"
                  class="text-xs px-3 py-1 rounded-full transition-all"
                  :class="
                    noticeFilter === f
                      ? 'bg-white text-bdGreen-700 font-bold'
                      : 'bg-white/20 hover:bg-white/30'
                  "
                >
                  {{ f }}
                </button>
              </div>
            </div>
            <div class="border-b border-gray-100 bg-gray-50 px-5 py-4">
              <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
                <label class="relative block">
                  <i
                    class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                  ></i>
                  <input
                    v-model.trim="noticeSearch"
                    type="search"
                    placeholder="নোটিশ খুঁজুন..."
                    class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-bdGreen-500 focus:ring-2 focus:ring-bdGreen-100"
                  />
                </label>
                <select
                  v-model="noticeYear"
                  class="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 outline-none focus:border-bdGreen-500"
                >
                  <option value="">সকল বছর</option>
                  <option v-for="year in noticeYears" :key="year" :value="year">
                    {{ year }} সাল
                  </option>
                </select>
              </div>
              <div class="mt-3 flex items-center justify-between gap-3 text-xs">
                <span class="text-gray-500"
                  >{{ filteredNotices.length }} টি নোটিশ পাওয়া গেছে</span
                >
                <button
                  v-if="noticeSearch || noticeYear || noticeFilter !== 'সকল'"
                  @click="resetNoticeFilters"
                  class="font-semibold text-bdGreen-700 hover:text-bdGreen-800"
                >
                  <i class="fas fa-times-circle mr-1"></i>ফিল্টার মুছুন
                </button>
              </div>
            </div>
            <div class="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
              <div
                v-for="(n, i) in filteredNotices"
                :key="i"
                class="notice-item px-6 py-4 cursor-pointer flex items-start gap-4"
                @click="openNotice(n)"
              >
                <div
                  class="shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center"
                  :class="
                    n.urgent
                      ? 'bg-bdRed-50 text-bdRed-600'
                      : 'bg-bdGreen-50 text-bdGreen-600'
                  "
                >
                  <span class="text-xs font-bold leading-none">{{
                    n.date.split(" ")[0]
                  }}</span>
                  <span class="text-[10px] opacity-70">{{
                    n.date.split(" ")[1]
                  }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-sm text-gray-800 truncate">
                    {{ n.title }}
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ n.category }} | {{ n.date }}
                  </p>
                </div>
                <div class="shrink-0">
                  <span
                    v-if="n.urgent"
                    class="bg-bdRed-100 text-bdRed-600 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    >জরুরি</span
                  >
                  <span
                    v-else
                    class="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full"
                    >সাধারণ</span
                  >
                </div>
              </div>
            </div>
            <div class="px-6 py-3 bg-gray-50 text-center">
              <button
                @click="showNoticeArchive"
                class="text-sm text-bdGreen-600 hover:text-bdGreen-700 font-medium"
              >
                সকল নোটিশ দেখুন <i class="fas fa-arrow-right ml-1"></i>
              </button>
            </div>
          </div>

          <!-- Events Calendar -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div
              class="bg-bdGreen-800 text-white px-6 py-3 font-bold flex items-center gap-2"
            >
              <i class="fas fa-calendar-alt"></i> আসন্ন অনুষ্ঠান
            </div>
            <div class="p-5 space-y-4">
              <div
                v-for="(ev, i) in events"
                :key="i"
                class="flex gap-4 items-start p-3 rounded-xl hover:bg-bdGreen-50 transition-colors cursor-pointer group"
              >
                <div
                  class="w-14 h-14 rounded-xl bg-gradient-to-br from-bdGreen-500 to-bdGreen-700 text-white flex flex-col items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                >
                  <span class="text-lg font-black leading-none">{{
                    ev.day
                  }}</span>
                  <span class="text-[10px] font-medium opacity-80">{{
                    ev.month
                  }}</span>
                </div>
                <div>
                  <p class="font-semibold text-sm text-gray-800">
                    {{ ev.title }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    <i class="far fa-clock mr-1"></i>{{ ev.time }}
                  </p>
                </div>
              </div>
            </div>
            <!-- Mini Calendar -->
            <div class="px-5 pb-5">
              <div
                class="bg-gradient-to-br from-bdGreen-50 to-bdGreen-100 rounded-xl p-4"
              >
                <div class="flex items-center justify-between mb-3">
                  <button
                    @click="prevMonth"
                    class="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-bdGreen-100 transition-colors"
                  >
                    <i class="fas fa-chevron-left text-xs text-bdGreen-700"></i>
                  </button>
                  <span class="font-bold text-sm text-bdGreen-800"
                    >{{ currentMonthName }} {{ currentYear }}</span
                  >
                  <button
                    @click="nextMonth"
                    class="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-bdGreen-100 transition-colors"
                  >
                    <i
                      class="fas fa-chevron-right text-xs text-bdGreen-700"
                    ></i>
                  </button>
                </div>
                <div class="grid grid-cols-7 gap-1 text-center text-xs">
                  <span
                    v-for="d in ['শ', 'র', 'শ', 'ব', 'ব', 'শ', 'শ']"
                    :key="d"
                    class="text-bdGreen-600 font-bold py-1"
                    >{{ d }}</span
                  >
                  <span
                    v-for="day in calendarDays"
                    :key="day"
                    class="py-1.5 rounded-lg transition-colors cursor-pointer"
                    :class="
                      day === today
                        ? 'bg-bdGreen-600 text-white font-bold'
                        : calendarEventDays.has(day)
                          ? 'bg-gold-400 text-bdGreen-900 font-bold'
                          : day
                            ? 'hover:bg-bdGreen-200 text-gray-700'
                            : 'text-transparent'
                    "
                  >
                    {{ day || "." }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Academic Programs -->
    <section id="academics" class="py-20 bg-white section-reveal">
      <div class="max-w-7xl mx-auto px-4">
        <div class="text-center mb-14">
          <span
            class="inline-block bg-bdGreen-100 text-bdGreen-700 text-sm font-semibold px-4 py-1 rounded-full mb-4"
            >একাডেমিক</span
          >
          <h2 class="text-3xl md:text-4xl font-black text-gray-800">
            শিক্ষা কার্যক্রম
          </h2>
          <p class="text-gray-500 mt-3">প্রতিষ্ঠানের সক্রিয় একাডেমিক তথ্য</p>
        </div>

        <!-- Tabs -->
        <div
          v-if="academicTabs.length"
          class="flex flex-wrap justify-center gap-3 mb-12"
        >
          <button
            v-for="tab in academicTabs"
            :key="tab.id"
            @click="activeAcademicTab = tab.id"
            class="tab-btn px-6 py-3 rounded-xl text-sm font-bold border-2 border-gray-200"
            :class="
              activeAcademicTab === tab.id
                ? 'active border-bdGreen-600'
                : 'text-gray-600 hover:border-bdGreen-300'
            "
          >
            <i :class="tab.icon" class="mr-2"></i>{{ tab.label }}
          </button>
        </div>

        <!-- Tab Content -->
        <transition name="fade" mode="out-in">
          <div
            v-if="academicLoading"
            key="loading"
            class="py-12 text-center text-gray-500"
          >
            <i class="fas fa-spinner fa-spin mr-2"></i>একাডেমিক তথ্য লোড
            হচ্ছে...
          </div>
          <div
            v-else-if="filteredAcademicClasses.length"
            :key="activeAcademicTab"
            class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div
              v-for="cls in filteredAcademicClasses"
              :key="cls.class_id"
              class="card-hover bg-gradient-to-br from-white to-bdGreen-50 rounded-2xl p-6 border border-bdGreen-100"
            >
              <div
                class="w-14 h-14 rounded-2xl bg-bdGreen-600 text-white flex items-center justify-center text-lg font-black mb-4"
              >
                {{ cls.class_code_bn || cls.class_code }}
              </div>
              <h3 class="font-bold text-lg text-gray-800 mb-2">
                {{ cls.class_name_bn || cls.class_name }}
              </h3>
              <div class="space-y-2 text-sm text-gray-500">
                <p>
                  <i class="fas fa-layer-group mr-2 text-bdGreen-500"></i>স্তর:
                  <span class="font-semibold text-gray-700">{{
                    cls.level_name_bn || cls.level_name || "নির্ধারিত নয়"
                  }}</span>
                </p>
                <p>
                  <i class="fas fa-section mr-2 text-bdGreen-500"></i>উপলব্ধ
                  শাখা:
                  <span class="font-semibold text-gray-700">{{
                    sectionNames || "তথ্য নেই"
                  }}</span>
                </p>
                <p>
                  <i class="fas fa-clock mr-2 text-bdGreen-500"></i>পরিচালিত
                  শিফট:
                  <span class="font-semibold text-gray-700">{{
                    shiftNames || "তথ্য নেই"
                  }}</span>
                </p>
              </div>
              <button
                @click="
                  showToast(
                    `${cls.class_name_bn || cls.class_name} এর তথ্য প্রদর্শিত হচ্ছে`,
                    'info',
                  )
                "
                class="mt-4 w-full py-2.5 rounded-xl border-2 border-bdGreen-600 text-bdGreen-600 font-bold text-sm hover:bg-bdGreen-600 hover:text-white transition-all"
              >
                বিস্তারিত দেখুন
              </button>
            </div>
          </div>
          <div v-else key="empty" class="py-12 text-center text-gray-500">
            <i class="fas fa-school text-bdGreen-500 mr-2"></i>বর্তমানে কোনো
            সক্রিয় শিক্ষা কার্যক্রম পাওয়া যায়নি।
          </div>
        </transition>
      </div>
    </section>

    <!-- Results Section -->
    <section
      id="results"
      class="py-20 bg-gradient-to-br from-bdGreen-900 via-bdGreen-800 to-bdGreen-900 text-white section-reveal"
    >
      <div class="max-w-7xl mx-auto px-4">
        <div class="text-center mb-14">
          <span
            class="inline-block bg-white/10 text-bdGreen-300 text-sm font-semibold px-4 py-1 rounded-full mb-4"
            >পরীক্ষার ফলাফল</span
          >
          <h2 class="text-3xl md:text-4xl font-black">শিক্ষার্থীদের সাফল্য</h2>
          <p class="text-green-200 mt-3">গত ৫ বছরের পাবলিক পরীক্ষার ফলাফল</p>
        </div>

        <!-- Result Cards -->
        <div class="grid md:grid-cols-3 gap-6 mb-12">
          <div
            v-for="(r, i) in resultStats"
            :key="i"
            class="glass rounded-2xl p-6 text-center card-hover"
          >
            <div class="text-5xl font-black text-gold-400 mb-2">
              {{ r.rate }}%
            </div>
            <h3 class="text-lg font-bold mb-1">{{ r.exam }}</h3>
            <p class="text-sm text-green-300">{{ r.year }} সাল</p>
            <div class="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-gold-400 to-gold-600 rounded-full transition-all duration-1000"
                :style="{ width: r.rate + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Result Checker -->
        <div class="max-w-2xl mx-auto glass rounded-2xl p-8">
          <h3
            class="text-xl font-bold text-center mb-6 flex items-center justify-center gap-2"
          >
            <i class="fas fa-search text-gold-400"></i> ফলাফল অনুসন্ধান
          </h3>
          <div class="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="text-sm text-green-200 mb-1 block"
                >পরীক্ষা নির্বাচন</label
              >
              <select
                v-model="resultSearch.exam"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:border-gold-400"
              >
                <option value="" class="text-gray-800">
                  পরীক্ষা নির্বাচন করুন
                </option>
                <option value="ssc" class="text-gray-800">
                  এসএসসি (দাখিল)
                </option>
                <option value="hsc" class="text-gray-800">
                  এইচএসসি (আলিম)
                </option>
                <option value="jsc" class="text-gray-800">
                  জেএসসি (জেডিসি)
                </option>
              </select>
            </div>
            <div>
              <label class="text-sm text-green-200 mb-1 block">সাল</label>
              <select
                v-model="resultSearch.year"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:border-gold-400"
              >
                <option value="" class="text-gray-800">
                  সাল নির্বাচন করুন
                </option>
                <option
                  v-for="y in years"
                  :key="y"
                  :value="y"
                  class="text-gray-800"
                >
                  {{ y }}
                </option>
              </select>
            </div>
          </div>
          <div class="mb-6">
            <label class="text-sm text-green-200 mb-1 block">রোল নম্বর</label>
            <input
              v-model="resultSearch.roll"
              type="text"
              placeholder="রোল নম্বর লিখুন"
              class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/40"
            />
          </div>
          <button
            @click="checkResult"
            class="w-full bg-gradient-to-r from-gold-400 to-gold-600 text-bdGreen-900 py-3.5 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-gold-400/30 transition-all active:scale-[0.98]"
          >
            ফলাফল দেখুন
          </button>
          <div class="mt-4 text-center">
            <a
              href="http://www.eboardresults.com/"
              target="_blank"
              class="text-sm text-green-300 hover:text-gold-400 transition-colors"
            >
              <i class="fas fa-external-link-alt mr-1"></i> বোর্ড/মাদরাসা ফলাফল
              দেখুন
            </a>
          </div>

          <!-- Result Display -->
          <transition name="fade">
            <div
              v-if="resultData"
              class="mt-6 bg-white/10 rounded-xl p-6 anim-slide-up"
            >
              <div class="text-center mb-4">
                <div class="text-6xl font-black text-gold-400">
                  {{ resultData.gpa }}
                </div>
                <div class="text-lg font-bold mt-1">{{ resultData.grade }}</div>
              </div>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="bg-white/5 rounded-lg p-3">
                  <span class="text-green-300">নাম:</span> {{ resultData.name }}
                </div>
                <div class="bg-white/5 rounded-lg p-3">
                  <span class="text-green-300">রোল:</span> {{ resultData.roll }}
                </div>
                <div class="bg-white/5 rounded-lg p-3">
                  <span class="text-green-300">পরীক্ষা:</span>
                  {{ resultData.exam.toUpperCase() }}
                </div>
                <div class="bg-white/5 rounded-lg p-3">
                  <span class="text-green-300">সাল:</span> {{ resultData.year }}
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </section>

    <!-- Teachers Section -->
    <section id="teachers" class="py-20 bg-gray-50 section-reveal">
      <div class="max-w-7xl mx-auto px-4">
        <div class="text-center mb-14">
          <span
            class="inline-block bg-bdGreen-100 text-bdGreen-700 text-sm font-semibold px-4 py-1 rounded-full mb-4"
            >শিক্ষকমণ্ডলী</span
          >
          <h2 class="text-3xl md:text-4xl font-black text-gray-800">
            আমাদের অভিজ্ঞ শিক্ষকগণ
          </h2>
          <p class="text-gray-500 mt-3">
            অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষকদের পরিচালনায় মানসম্মত শিক্ষা
          </p>
        </div>

        <!-- Teacher Filter -->
        <div class="flex flex-wrap justify-center gap-3 mb-10">
          <button
            v-for="tf in teacherFilters"
            :key="tf"
            @click="teacherFilter = tf"
            class="px-5 py-2 rounded-full text-sm font-medium transition-all"
            :class="
              teacherFilter === tf
                ? 'bg-bdGreen-600 text-white shadow-lg shadow-bdGreen-600/25'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-bdGreen-300'
            "
          >
            {{ tf }}
          </button>
        </div>

        <div
          v-if="filteredTeachers.length"
          class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div
            v-for="(t, i) in filteredTeachers"
            :key="t.id || t.employee_no || i"
            class="teacher-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative group"
          >
            <div class="h-48 relative overflow-hidden">
              <img
                v-if="t.photo"
                :src="t.photo"
                :alt="t.name"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div
                v-else
                class="w-full h-full bg-bdGreen-100 text-bdGreen-600 flex items-center justify-center"
              >
                <i class="fas fa-user-tie text-6xl"></i>
              </div>
              <div
                v-if="t.email || t.phone"
                class="teacher-overlay absolute inset-0 bg-gradient-to-t from-bdGreen-900/90 via-bdGreen-900/40 to-transparent flex items-end p-4"
              >
                <div class="flex gap-2">
                  <a
                    v-if="t.email"
                    :href="`mailto:${t.email}`"
                    :aria-label="`${t.name}কে ইমেইল করুন`"
                    title="ইমেইল করুন"
                    class="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-colors text-xs"
                  >
                    <i class="fas fa-envelope"></i>
                  </a>
                  <a
                    v-if="t.phone"
                    :href="phoneHref(t.phone)"
                    :aria-label="`${t.name}কে কল করুন`"
                    title="কল করুন"
                    class="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-colors text-xs"
                  >
                    <i class="fas fa-phone"></i>
                  </a>
                </div>
              </div>
              <div
                v-if="!filteredNotices.length"
                class="px-6 py-10 text-center text-sm text-gray-400"
              >
                বর্তমানে কোনো নোটিশ প্রকাশিত নেই।
              </div>
              <span
                class="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                :class="
                  (t.designation || '').includes('অধ্যক্ষ') ||
                  (t.designation || '').includes('প্রধান')
                    ? 'bg-gold-400 text-bdGreen-900'
                    : 'bg-white/90 text-gray-600'
                "
              >
                {{ t.designation }}
              </span>
            </div>
            <div class="p-4">
              <h4 class="font-bold text-gray-800">{{ t.name }}</h4>
              <p v-if="t.subject" class="text-xs text-gray-400 mt-0.5">
                {{ t.subject }}
              </p>
              <p class="text-xs text-bdGreen-600 mt-1 font-medium">
                {{ t.designation }}
              </p>
            </div>
          </div>
        </div>
        <div
          v-else
          class="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500"
        >
          শিক্ষক তথ্য শিগগিরই প্রকাশ করা হবে।
        </div>
      </div>
    </section>

    <!-- Admission Section -->
    <section id="admission" class="py-20 bg-white section-reveal">
      <div class="max-w-7xl mx-auto px-4">
        <div class="text-center mb-14">
          <span
            class="inline-block bg-bdGreen-100 text-bdGreen-700 text-sm font-semibold px-4 py-1 rounded-full mb-4"
            >ভর্তি তথ্য</span
          >
          <h2 class="text-3xl md:text-4xl font-black text-gray-800">
            ভর্তি প্রক্রিয়া
          </h2>
          <p class="text-gray-500 mt-3">
            সরকারি বিধি অনুযায়ী অনলাইনে ভর্তি কার্যক্রম পরিচালিত
          </p>
        </div>

        <div class="grid lg:grid-cols-2 gap-12 items-start">
          <!-- Steps -->
          <div>
            <h3
              class="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2"
            >
              <i class="fas fa-list-ol text-bdGreen-600"></i> ভর্তির ধাপসমূহ
            </h3>
            <div class="space-y-0">
              <div
                v-for="(step, i) in admissionSteps"
                :key="i"
                class="step-line flex gap-5 pb-8"
              >
                <div
                  class="shrink-0 w-12 h-12 rounded-full bg-bdGreen-600 text-white flex items-center justify-center font-black text-lg z-10"
                >
                  {{ i + 1 }}
                </div>
                <div class="pt-2">
                  <h4 class="font-bold text-gray-800">{{ step.title }}</h4>
                  <p class="text-sm text-gray-500 mt-1">{{ step.desc }}</p>
                  <span
                    v-if="step.date"
                    class="inline-block mt-2 text-xs bg-bdRed-50 text-bdRed-600 px-3 py-1 rounded-full font-medium"
                  >
                    <i class="far fa-clock mr-1"></i>{{ step.date }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Requirements & Info -->
          <div class="space-y-6">
            <div
              class="bg-gradient-to-br from-bdGreen-50 to-bdGreen-100 rounded-2xl p-6 border border-bdGreen-200"
            >
              <h4
                class="font-bold text-bdGreen-800 mb-4 flex items-center gap-2"
              >
                <i class="fas fa-clipboard-check"></i> ভর্তির প্রয়োজনীয়তা
              </h4>
              <ul class="space-y-3">
                <li
                  v-for="(req, i) in admissionReqs"
                  :key="i"
                  class="flex items-start gap-3 text-sm text-gray-700"
                >
                  <i
                    class="fas fa-check-circle text-bdGreen-500 mt-0.5 shrink-0"
                  ></i>
                  <span>{{ req }}</span>
                </li>
              </ul>
            </div>
            <div
              class="bg-gradient-to-br from-gold-400/10 to-gold-600/10 rounded-2xl p-6 border border-gold-400/30"
            >
              <h4 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i class="fas fa-info-circle text-gold-500"></i> গুরুত্বপূর্ণ
                তথ্য
              </h4>
              <div class="space-y-3 text-sm text-gray-600">
                <div
                  class="flex justify-between py-2 border-b border-gold-400/20"
                >
                  <span>আবেদন ফি (স্কুল)</span>
                  <span class="font-bold text-gray-800">১৫০ টাকা</span>
                </div>
                <div
                  class="flex justify-between py-2 border-b border-gold-400/20"
                >
                  <span>আবেদন ফি (কলেজ)</span>
                  <span class="font-bold text-gray-800">২০০ টাকা</span>
                </div>
                <div
                  class="flex justify-between py-2 border-b border-gold-400/20"
                >
                  <span>আবেদনের মাধ্যম</span>
                  <span class="font-bold text-bdGreen-600">অনলাইন/অফিস</span>
                </div>
                <div class="flex justify-between py-2">
                  <span>ভর্তি ওয়েবসাইট</span>
                  <a
                    href="http://admission.example.com/"
                    target="_blank"
                    class="font-bold text-bdGreen-600 hover:underline"
                    >admission.example.com</a
                  >
                </div>
              </div>
            </div>
            <button
              @click="showAdmissionModal = true"
              class="w-full bg-bdGreen-600 hover:bg-bdGreen-700 text-white py-4 rounded-xl font-bold text-lg transition-all hover:shadow-xl hover:shadow-bdGreen-600/25 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <i class="fas fa-paper-plane"></i> এখনই আবেদন করুন
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Gallery Section -->
    <section id="gallery" class="py-20 bg-gray-50 section-reveal">
      <div class="max-w-7xl mx-auto px-4">
        <div class="text-center mb-14">
          <span
            class="inline-block bg-bdGreen-100 text-bdGreen-700 text-sm font-semibold px-4 py-1 rounded-full mb-4"
            >গ্যালারি</span
          >
          <h2 class="text-3xl md:text-4xl font-black text-gray-800">
            আমাদের গ্যালারি
          </h2>
          <p class="text-gray-500 mt-3">
            প্রতিষ্ঠানের বিভিন্ন কার্যক্রমের স্মৃতি
          </p>
        </div>

        <div class="flex flex-wrap justify-center gap-3 mb-10">
          <button
            v-for="cat in galleryCategories"
            :key="cat"
            @click="galleryFilter = cat"
            class="px-5 py-2 rounded-full text-sm font-medium transition-all"
            :class="
              galleryFilter === cat
                ? 'bg-bdGreen-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-bdGreen-300'
            "
          >
            {{ cat }}
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="(img, i) in filteredGallery"
            :key="i"
            class="relative group rounded-2xl overflow-hidden cursor-pointer aspect-square"
            @click="openGalleryModal(i)"
          >
            <img
              :src="img.src"
              :alt="img.title"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4"
            >
              <div class="text-white">
                <p class="font-bold text-sm">{{ img.title }}</p>
                <p class="text-xs text-white/70">{{ img.category }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Important Links & Gov Portal -->
    <section class="py-16 bg-white section-reveal">
      <div class="max-w-7xl mx-auto px-4">
        <div class="text-center mb-14">
          <span
            class="inline-block bg-bdGreen-100 text-bdGreen-700 text-sm font-semibold px-4 py-1 rounded-full mb-4"
            >গুরুত্বপূর্ণ লিংক</span
          >
          <h2 class="text-3xl md:text-4xl font-black text-gray-800">
            সরকারি ও শিক্ষা সংক্রান্ত লিংক
          </h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <a
            v-for="(link, i) in govLinks"
            :key="i"
            :href="link.url"
            target="_blank"
            class="card-hover bg-gray-50 hover:bg-bdGreen-50 rounded-2xl p-5 text-center border border-gray-100 hover:border-bdGreen-200 group"
          >
            <div
              class="w-12 h-12 mx-auto rounded-xl bg-white shadow-sm flex items-center justify-center text-bdGreen-600 text-xl mb-3 group-hover:bg-bdGreen-600 group-hover:text-white transition-all"
            >
              <i :class="link.icon"></i>
            </div>
            <p class="text-xs font-medium text-gray-700 leading-tight">
              {{ link.name }}
            </p>
          </a>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="py-20 bg-gray-50 section-reveal">
      <div class="max-w-7xl mx-auto px-4">
        <div class="text-center mb-14">
          <span
            class="inline-block bg-bdGreen-100 text-bdGreen-700 text-sm font-semibold px-4 py-1 rounded-full mb-4"
            >যোগাযোগ</span
          >
          <h2 class="text-3xl md:text-4xl font-black text-gray-800">
            আমাদের সাথে যোগাযোগ করুন
          </h2>
        </div>
        <div class="grid lg:grid-cols-2 gap-10">
          <!-- Contact Info -->
          <div class="space-y-6">
            <div
              v-for="(c, i) in dynamicContactInfo"
              :key="i"
              class="flex items-start gap-4 bg-white rounded-2xl p-5 border border-gray-100 card-hover"
            >
              <div
                class="w-12 h-12 rounded-xl bg-bdGreen-50 text-bdGreen-600 flex items-center justify-center text-xl shrink-0"
              >
                <i :class="c.icon"></i>
              </div>
              <div>
                <h4 class="font-bold text-gray-800 text-sm">{{ c.label }}</h4>
                <p class="text-sm text-gray-500 mt-1">{{ c.value }}</p>
              </div>
            </div>
            <!-- Map -->
            <div
              class="rounded-2xl overflow-hidden border border-gray-100 h-56"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.9027569682715!2d90.41279687505288!3d23.75090917868289!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b087026b81%3A0x8fa563bbdd5904c2!2sDhaka!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
                width="100%"
                height="100%"
                style="border: 0"
                allowfullscreen=""
                loading="lazy"
              ></iframe>
            </div>
          </div>

          <!-- Contact Form -->
          <div
            class="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
          >
            <h3 class="text-xl font-bold text-gray-800 mb-6">মেসেজ পাঠান</h3>
            <form @submit.prevent="submitContact" class="space-y-4">
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-600 mb-1 block"
                    >নাম *</label
                  >
                  <input
                    v-model="contactForm.name"
                    type="text"
                    required
                    placeholder="আপনার নাম"
                    class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-600 mb-1 block"
                    >মোবাইল *</label
                  >
                  <input
                    v-model="contactForm.phone"
                    type="tel"
                    required
                    placeholder="০১৫১৮৩৬৬১৭৮"
                    class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600 mb-1 block"
                  >ইমেইল</label
                >
                <input
                  v-model="contactForm.email"
                  type="email"
                  placeholder="example@email.com"
                  class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-en"
                />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600 mb-1 block"
                  >বিষয় *</label
                >
                <select
                  v-model="contactForm.subject"
                  required
                  class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
                >
                  <option value="">নির্বাচন করুন</option>
                  <option>ভর্তি সংক্রান্ত</option>
                  <option>ফলাফল সংক্রান্ত</option>
                  <option>নোটিশ সংক্রান্ত</option>
                  <option>অভিযোগ/পরামর্শ</option>
                  <option>অন্যান্য</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600 mb-1 block"
                  >মেসেজ *</label
                >
                <textarea
                  v-model="contactForm.message"
                  required
                  rows="4"
                  placeholder="আপনার মেসেজ লিখুন..."
                  class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                :disabled="contactSending"
                class="w-full bg-bdGreen-600 hover:bg-bdGreen-700 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <i
                  :class="
                    contactSending
                      ? 'fas fa-spinner animate-spin'
                      : 'fas fa-paper-plane'
                  "
                ></i>
                {{ contactSending ? "পাঠানো হচ্ছে..." : "মেসেজ পাঠান" }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-bdGreen-900 text-white">
      <div class="max-w-7xl mx-auto px-4 py-16">
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          <!-- About -->
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center p-1"
              >
                <img
                  src="/logo.png"
                  alt="বিদ্যালয়ের লোগো"
                  class="w-full h-full object-contain rounded-full"
                  onerror="this.style.display = 'none'"
                />
              </div>
              <div>
                <h4 class="font-bold text-sm">{{ schoolSettings.name_bn }}</h4>
                <p class="text-xs text-green-300 font-en">
                  {{ schoolSettings.name_en }}
                </p>
              </div>
            </div>
            <p class="text-sm text-green-200/70 leading-relaxed">
              শিক্ষা মন্ত্রণালয়, গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের অধীনে পরিচালিত
              এই প্রতিষ্ঠানটি ১ জানুয়ারি ১৯৪৯ সালে প্রতিষ্ঠিত।
            </p>
          </div>

          <!-- Quick Links -->
          <div>
            <h4 class="font-bold mb-4 text-gold-400">দ্রুত লিংক</h4>
            <ul class="space-y-2 text-sm text-green-200/70">
              <li v-for="item in navItems" :key="item.id">
                <a
                  :href="'#' + item.id"
                  class="hover:text-white transition-colors flex items-center gap-2"
                >
                  <i
                    class="fas fa-chevron-right text-[10px] text-bdGreen-400"
                  ></i
                  >{{ item.label }}
                </a>
              </li>
            </ul>
          </div>

          <!-- Education Links -->
          <div>
            <h4 class="font-bold mb-4 text-gold-400">শিক্ষা লিংক</h4>
            <ul class="space-y-2 text-sm text-green-200/70">
              <li>
                <a
                  href="https://www.moedu.gov.bd/"
                  target="_blank"
                  class="hover:text-white transition-colors flex items-center gap-2"
                  ><i
                    class="fas fa-external-link-alt text-[10px] text-bdGreen-400"
                  ></i
                  >শিক্ষা মন্ত্রণালয়</a
                >
              </li>
              <li>
                <a
                  href="http://www.bmeb.gov.bd/"
                  target="_blank"
                  class="hover:text-white transition-colors flex items-center gap-2"
                  ><i
                    class="fas fa-external-link-alt text-[10px] text-bdGreen-400"
                  ></i
                  >বাংলাদেশ মাদরাসা শিক্ষা বোর্ড</a
                >
              </li>
              <li>
                <a
                  href="https://bmeb.ebmeb.gov.bd/"
                  target="_blank"
                  class="hover:text-white transition-colors flex items-center gap-2"
                  ><i
                    class="fas fa-external-link-alt text-[10px] text-bdGreen-400"
                  ></i
                  >এনসিটিবি</a
                >
              </li>
              <li>
                <a
                  href="https://bangladesh.gov.bd/"
                  target="_blank"
                  class="hover:text-white transition-colors flex items-center gap-2"
                  ><i
                    class="fas fa-external-link-alt text-[10px] text-bdGreen-400"
                  ></i
                  >বাংলাদেশ সরকার</a
                >
              </li>
              <li>
                <a
                  href="http://admission.example.com/"
                  target="_blank"
                  class="hover:text-white transition-colors flex items-center gap-2"
                  ><i
                    class="fas fa-external-link-alt text-[10px] text-bdGreen-400"
                  ></i
                  >ভর্তি আবেদন</a
                >
              </li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h4 class="font-bold mb-4 text-gold-400">যোগাযোগ</h4>
            <div class="space-y-3 text-sm text-green-200/70">
              <p class="flex items-start gap-2">
                <i class="fas fa-map-marker-alt text-bdGreen-400 mt-1"></i>
                {{ schoolSettings.address }}
              </p>
              <p class="flex items-center gap-2">
                <i class="fas fa-phone text-bdGreen-400"></i>
                {{ schoolSettings.phone }}
              </p>
              <p class="flex items-center gap-2">
                <i class="fas fa-envelope text-bdGreen-400"></i>
                {{ schoolSettings.email }}
              </p>
            </div>
            <div class="flex gap-3 mt-5">
              <a
                href="#"
                class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-bdGreen-600 transition-colors"
                ><i class="fab fa-facebook-f"></i
              ></a>
              <a
                href="#"
                class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-bdRed-600 transition-colors"
                ><i class="fab fa-youtube"></i
              ></a>
              <a
                href="#"
                class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-blue-500 transition-colors"
                ><i class="fab fa-twitter"></i
              ></a>
            </div>
          </div>
        </div>
      </div>
      <div class="border-t border-white/10">
        <div
          class="max-w-7xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4 text-sm text-green-200/50"
        >
          <p>&copy; ২০২৫ {{ schoolSettings.name_bn }} | সর্বস্বত্ব সংরক্ষিত</p>
          <p class="font-en">
            Developed with
            <i class="fas fa-heart text-bdRed-500 text-xs"></i> for Bangladesh
            Government Education
          </p>
        </div>
      </div>
    </footer>

    <!-- Scroll to Top -->
    <transition name="fade">
      <button
        v-if="scrolled"
        @click="scrollToTop"
        class="fixed bottom-6 right-6 w-12 h-12 bg-bdGreen-600 hover:bg-bdGreen-700 text-white rounded-full shadow-xl shadow-bdGreen-600/30 flex items-center justify-center z-50 transition-all hover:scale-110"
      >
        <i class="fas fa-arrow-up"></i>
      </button>
    </transition>

    <!-- Toast Notifications -->
    <div class="fixed top-24 right-4 z-50 space-y-3 max-w-sm">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border toast-enter"
          :class="{
            'bg-white border-bdGreen-200 text-gray-800':
              toast.type === 'success',
            'bg-white border-blue-200 text-gray-800': toast.type === 'info',
            'bg-white border-bdRed-200 text-gray-800': toast.type === 'error',
            'bg-white border-gold-400 text-gray-800': toast.type === 'warning',
          }"
        >
          <i
            :class="{
              'fas fa-check-circle text-bdGreen-500': toast.type === 'success',
              'fas fa-info-circle text-blue-500': toast.type === 'info',
              'fas fa-exclamation-circle text-bdRed-500':
                toast.type === 'error',
              'fas fa-exclamation-triangle text-gold-500':
                toast.type === 'warning',
            }"
            class="mt-0.5"
          ></i>
          <p class="text-sm flex-1">{{ toast.message }}</p>
          <button
            @click="removeToast(toast.id)"
            class="text-gray-400 hover:text-gray-600"
          >
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>
      </transition-group>
    </div>

    <!-- Admission Modal -->
    <transition name="fade">
      <div
        v-if="showAdmissionModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
        @click.self="showAdmissionModal = false"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div
          class="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto modal-content"
        >
          <div class="bg-bdGreen-600 text-white rounded-t-3xl px-8 py-6">
            <button
              @click="showAdmissionModal = false"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <i class="fas fa-times"></i>
            </button>
            <h3 class="text-xl font-bold flex items-center gap-2">
              <i class="fas fa-pen-to-square"></i> অনলাইন আবেদন ফর্ম
            </h3>
            <p class="text-sm text-green-100 mt-1">
              বাংলাদেশ মাদরাসা শিক্ষা বোর্ডের নিয়ম অনুযায়ী আবেদন পূরণ করুন
            </p>
          </div>
          <form @submit.prevent="submitAdmission" class="p-8 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-600 mb-1 block"
                  >শিক্ষার্থীর নাম *</label
                >
                <input
                  v-model="admForm.name"
                  type="text"
                  required
                  class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600 mb-1 block"
                  >পিতার নাম *</label
                >
                <input
                  v-model="admForm.father"
                  type="text"
                  required
                  class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-600 mb-1 block"
                  >মাতার নাম *</label
                >
                <input
                  v-model="admForm.mother"
                  type="text"
                  required
                  class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600 mb-1 block"
                  >জন্ম তারিখ *</label
                >
                <input
                  v-model="admForm.dob"
                  type="date"
                  required
                  class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-en"
                />
              </div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600 mb-1 block"
                >শ্রেণি নির্বাচন *</label
              >
              <select
                v-model="admForm.class"
                required
                class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
              >
                <option value="">নির্বাচন করুন</option>
                <option
                  v-for="c in [
                    'ষষ্ঠ',
                    'সপ্তম',
                    'অষ্টম',
                    'নবম',
                    'দশম',
                    'একাদশ',
                    'দ্বাদশ',
                  ]"
                  :key="c"
                >
                  {{ c }} শ্রেণি
                </option>
              </select>
            </div>
            <div v-if="admForm.class === 'একাদশ' || admForm.class === 'দ্বাদশ'">
              <label class="text-sm font-medium text-gray-600 mb-1 block"
                >বিভাগ নির্বাচন *</label
              >
              <select
                v-model="admForm.department"
                required
                class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
              >
                <option value="">নির্বাচন করুন</option>
                <option>বিজ্ঞান</option>
                <option>মানবিক</option>
                <option>ব্যবসায় শিক্ষা</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600 mb-1 block"
                >মোবাইল নম্বর *</label
              >
              <input
                v-model="admForm.phone"
                type="tel"
                required
                placeholder="০১৫১৮৩৬৬১৭৮"
                class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600 mb-1 block"
                >পূর্ববর্তী পরীক্ষার GPA</label
              >
              <input
                v-model="admForm.gpa"
                type="text"
                placeholder="যেমন: ৫.০০"
                class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-en"
              />
            </div>
            <button
              type="submit"
              :disabled="admSending"
              class="w-full bg-bdGreen-600 hover:bg-bdGreen-700 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <i
                :class="
                  admSending
                    ? 'fas fa-spinner animate-spin'
                    : 'fas fa-paper-plane'
                "
              ></i>
              {{ admSending ? "জমা হচ্ছে..." : "আবেদন জমা দিন" }}
            </button>
            <p class="text-xs text-gray-400 text-center">
              ভর্তি পোর্টাল (gsteletalk.com.bd) এর মাধ্যমে চূড়ান্ত আবেদন করতে
              হবে
            </p>
          </form>
        </div>
      </div>
    </transition>

    <!-- Notice Detail Modal -->
    <transition name="fade">
      <div
        v-if="showNoticeModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
        @click="showNoticeModal = false"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div
          class="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content"
          @click.stop
        >
          <div class="bg-bdGreen-600 text-white rounded-t-3xl px-8 py-6">
            <button
              @click="showNoticeModal = false"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <i class="fas fa-times"></i>
            </button>
            <span class="text-xs bg-white/20 px-3 py-1 rounded-full">{{
              selectedNotice.category
            }}</span>
            <h3 class="text-lg font-bold mt-3">{{ selectedNotice.title }}</h3>
            <p class="text-sm text-green-100 mt-1">
              <i class="far fa-calendar mr-1"></i>{{ selectedNotice.date }}
            </p>
          </div>
          <div class="p-8">
            <div
              v-if="selectedNotice.detail_html"
              class="notice-rich-text text-gray-600 leading-relaxed"
              v-html="selectedNotice.detail_html"
            ></div>
            <p v-else class="text-gray-600 leading-relaxed">
              {{ selectedNotice.detail }}
            </p>
            <div class="mt-6 flex gap-3">
              <a
                v-if="selectedNotice.attachment_url"
                :href="selectedNotice.attachment_url"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 bg-bdGreen-50 text-bdGreen-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-bdGreen-100 transition-colors"
              >
                <i class="fas fa-external-link-alt"></i> ওপেন
              </a>
              <a
                v-if="selectedNotice.attachment_url"
                :href="selectedNotice.attachment_url"
                download
                class="flex items-center gap-2 bg-bdGreen-50 text-bdGreen-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-bdGreen-100 transition-colors"
              >
                <i class="fas fa-download"></i> ডাউনলোড
              </a>
              <button
                @click="printNotice"
                class="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <i class="fas fa-print"></i> প্রিন্ট
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Gallery Lightbox -->
    <transition name="fade">
      <div
        v-if="showGalleryModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
        @click.self="showGalleryModal = false"
      >
        <div class="absolute inset-0 bg-black/90"></div>
        <button
          @click="prevGalleryImg"
          class="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="relative max-w-4xl w-full">
          <img
            :src="filteredGallery[galleryIndex]?.src"
            :alt="filteredGallery[galleryIndex]?.title"
            class="w-full max-h-[80vh] object-contain rounded-xl"
          />
          <div
            class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl p-6"
          >
            <p class="text-white font-bold">
              {{ filteredGallery[galleryIndex]?.title }}
            </p>
            <p class="text-white/60 text-sm">
              {{ filteredGallery[galleryIndex]?.category }}
            </p>
          </div>
        </div>
        <button
          @click="nextGalleryImg"
          class="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
        <button
          @click="showGalleryModal = false"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </transition>
  </template>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { api } from "./api.js";
import NoticeArchiveView from "./NoticeArchiveView.vue";

const adminLoginUrl = import.meta.env.VITE_ADMIN_URL || "/admin/login";
const isNoticeArchive =
  window.location.pathname.replace(/\/+$/, "") === "/notices";

// State
const scrolled = ref(false);
const mobileMenu = ref(false);
const isDark = ref(false);
const activeSection = ref("home");
const showAdmissionModal = ref(false);
const showNoticeModal = ref(false);
const showGalleryModal = ref(false);
const galleryIndex = ref(0);
const selectedNotice = ref({});
const contactSending = ref(false);
const admSending = ref(false);
const resultData = ref(null);
const toasts = ref([]);
let toastId = 0;

// Notice
const noticeFilter = ref("সকল");
const noticeFilters = ["সকল", "ভর্তি", "পরীক্ষা", "প্রশাসন", "সাধারণ"];
const noticeSearch = ref("");
const noticeYear = ref("");

// Academic
const activeAcademicTab = ref("all");
const academicLoading = ref(true);
const academicData = ref({
  levels: [],
  classes: [],
  sections: [],
  shifts: [],
});
const academicTabs = computed(() => {
  const levels = academicData.value.levels || [];
  return levels.length
    ? [
        {
          id: "all",
          label: "সকল শ্রেণি",
          icon: "fas fa-school",
        },
        ...levels.map((level) => ({
          id: String(level.level_id),
          label: level.level_name_bn || level.level_name,
          icon: "fas fa-layer-group",
        })),
      ]
    : [
        {
          id: "all",
          label: "সকল শ্রেণি",
          icon: "fas fa-school",
        },
      ];
});
const filteredAcademicClasses = computed(() => {
  const classes = academicData.value.classes || [];
  return activeAcademicTab.value === "all"
    ? classes
    : classes.filter((cls) => String(cls.level_id) === activeAcademicTab.value);
});
const sectionNames = computed(() =>
  (academicData.value.sections || [])
    .map((section) => section.section_name_bn || section.section_name)
    .filter(Boolean)
    .join(", "),
);
const shiftNames = computed(() =>
  (academicData.value.shifts || [])
    .map((shift) => shift.shift_name_bn || shift.shift_name)
    .filter(Boolean)
    .join(", "),
);
const phoneHref = (phone) => {
  const banglaDigits = "০১২৩৪৫৬৭৮৯";
  const normalized = String(phone)
    .replace(/[০-৯]/g, (digit) => String(banglaDigits.indexOf(digit)))
    .replace(/[^+\d]/g, "");
  return `tel:${normalized}`;
};

// Teacher
const teacherFilter = ref("সকল");

// Gallery
const galleryFilter = ref("সকল");

// Result Search
const resultSearch = ref({
  exam: "",
  year: "",
  roll: "",
});

// Contact Form
const contactForm = ref({
  name: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
});

// Admission Form
const admForm = ref({
  name: "",
  father: "",
  mother: "",
  dob: "",
  class: "",
  department: "",
  phone: "",
  gpa: "",
});

// Calendar
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());
const today = ref(new Date().getDate());
const schoolSettings = ref({
  name_bn: "পয়লা বানিয়াবাড়ী ফাজিল মাদরাসা",
  name_en: "PAILA BANIABARI FAZIL MADRASAH",
  eiin: "110124",
  phone: "০১৫۱۸۳۶۶۱۷۸",
  email: "pbm@yahoo.com",
  address: "বানিয়াবাড়ী, মাহমুদপুর, মেলান্দহ, জামালপুর",
  breaking_news:
    "পয়লা বানিয়াবাড়ী ফাজিল মাদরাসায় নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম চলছে।",
});

const monthNames = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];
const currentMonthName = computed(() => monthNames[currentMonth.value]);
const calendarDays = computed(() => {
  const first = new Date(currentYear.value, currentMonth.value, 1);
  const last = new Date(currentYear.value, currentMonth.value + 1, 0);
  const days = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let i = 1; i <= last.getDate(); i++) days.push(i);
  return days;
});
const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};
const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

// Data
const breakingNews = ref(
  "📢  পয়লা বানিয়াবাড়ী ফাজিল মাদরাসায় নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম চলছে। বিস্তারিত জানতে অফিসে যোগাযোগ করুন: ০১৫১৮৩৬৬১৭৮",
);

const navItems = [
  {
    id: "home",
    label: "প্রধান পাতা",
  },
  {
    id: "notice",
    label: "নোটিশ বোর্ড",
  },
  {
    id: "academics",
    label: "একাডেমিক",
  },
  {
    id: "results",
    label: "ফলাফল",
  },
  {
    id: "teachers",
    label: "শিক্ষকগণ",
  },
  {
    id: "admission",
    label: "ভর্তি",
  },
  {
    id: "gallery",
    label: "গ্যালারি",
  },
  {
    id: "contact",
    label: "যোগাযোগ",
  },
];

const quickStats = [
  {
    value: "২৫০০+",
    label: "শিক্ষার্থী",
  },
  {
    value: "৮৫+",
    label: "শিক্ষক",
  },
  {
    value: "৯৮%",
    label: "পাশের হার",
  },
];

const notices = ref([]);

const getNoticeYear = (notice) => {
  const value = String(notice.published_at_iso || notice.date || "");
  return value.match(/\d{4}/)?.[0] || "";
};
const noticeYears = computed(() =>
  [...new Set(notices.value.map(getNoticeYear).filter(Boolean))].sort(
    (first, second) => Number(second) - Number(first),
  ),
);
const filteredNotices = computed(() => {
  const keyword = noticeSearch.value.toLocaleLowerCase().trim();
  return notices.value.filter((notice) => {
    const matchesCategory =
      noticeFilter.value === "সকল" || notice.category === noticeFilter.value;
    const matchesYear =
      !noticeYear.value || getNoticeYear(notice) === noticeYear.value;
    const searchable = [notice.title, notice.category, notice.detail]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return (
      matchesCategory &&
      matchesYear &&
      (!keyword || searchable.includes(keyword))
    );
  });
});
const events = ref([]);
const parseEventDate = (value) => {
  const raw = String(value || "");
  const date = new Date(raw.includes("T") ? raw : `${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};
const calendarEventDays = computed(
  () =>
    new Set(
      events.value
        .filter((event) => {
          const date = parseEventDate(event.event_date);
          return (
            date &&
            date.getFullYear() === currentYear.value &&
            date.getMonth() === currentMonth.value
          );
        })
        .map((event) => parseEventDate(event.event_date)?.getDate())
        .filter(Boolean),
    ),
);
const resetNoticeFilters = () => {
  noticeFilter.value = "সকল";
  noticeSearch.value = "";
  noticeYear.value = "";
};

const resultStats = [
  {
    exam: "দাখিল",
    rate: 98.5,
    year: "২০২৪",
  },
  {
    exam: "আলিম",
    rate: 95.2,
    year: "২০২৪",
  },
  {
    exam: "জেডিসি",
    rate: 99.1,
    year: "২০২৪",
  },
];

const years = ["২০২৪", "২০২৩", "২০২২", "২০২১", "২০২০"];

const teachers = ref([]);
const teacherFilters = computed(() => [
  "সকল",
  ...new Set(teachers.value.map((teacher) => teacher.category).filter(Boolean)),
]);

const filteredTeachers = computed(() => {
  if (teacherFilter.value === "সকল") return teachers.value;
  return teachers.value.filter((t) => t.category === teacherFilter.value);
});

const admissionSteps = [
  {
    title: "অনলাইন আবেদন",
    desc: "ভর্তি পোর্টাল (admission.example.com) এর মাধ্যমে অনলাইনে আবেদন ফর্ম পূরণ করুন।",
    date: "১ জানু - ১৫ জানু ২০২৫",
  },
  {
    title: "পেমেন্ট সম্পন্ন",
    desc: "টেলিটক মোবাইল ব্যাংকিংয়ের মাধ্যমে আবেদন ফি পরিশোধ করুন।",
    date: "আবেদনের ৭২ ঘণ্টার মধ্যে",
  },
  {
    title: "নির্বাচন তালিকা প্রকাশ",
    desc: "লটারির মাধ্যমে নির্বাচিত শিক্ষার্থীদের তালিকা প্রকাশ।",
    date: "২৫ জানু ২০২৫",
  },
  {
    title: "ডকুমেন্ট যাচাই",
    desc: "নির্বাচিত শিক্ষার্থীদের মূল সনদপত্র সহ যাচাই।",
    date: "২৬ জানু - ৩০ জানু ২০২৫",
  },
  {
    title: "চূড়ান্ত ভর্তি",
    desc: "যাচাই সম্পন্ন হলে চূড়ান্ত ভর্তি নিশ্চিত করুন।",
    date: "১ ফেব্রু - ৫ ফেব্রু ২০২৫",
  },
];

const admissionReqs = [
  "এসএসসি/সমমান পরীক্ষায় উত্তীর্ণ (কলেজ ভর্তির জন্য)",
  "জেডিসি/সমমান পরীক্ষায় উত্তীর্ণ (উচ্চ শ্রেণিতে ভর্তির জন্য)",
  "নাগরিকত্ব সনদপত্রের ফটোকপি",
  "পাসপোর্ট সাইজের ছবি ২ কপি",
  "অভিভাবকের জাতীয় পরিচয়পত্রের ফটোকপি",
  "ট্রান্সফার সার্টিফিকেট (প্রযোজ্য ক্ষেত্রে)",
];

const galleryCategories = [
  "সকল",
  "ক্যাম্পাস",
  "অনুষ্ঠান",
  "খেলাধুলা",
  "শ্রেণিকক্ষ",
];

const galleryImages = [
  {
    src: "https://picsum.photos/seed/bdcampus1/600/600.jpg",
    title: "মূল ভবন",
    category: "ক্যাম্পাস",
  },
  {
    src: "https://picsum.photos/seed/bdcampus2/600/600.jpg",
    title: "পাঠাগার",
    category: "ক্যাম্পাস",
  },
  {
    src: "https://picsum.photos/seed/bdevent1/600/600.jpg",
    title: "বার্ষিক সাংস্কৃতিক অনুষ্ঠান",
    category: "অনুষ্ঠান",
  },
  {
    src: "https://picsum.photos/seed/bdsport1/600/600.jpg",
    title: "ক্রিকেট টুর্নামেন্ট",
    category: "খেলাধুলা",
  },
  {
    src: "https://picsum.photos/seed/bdclass1/600/600.jpg",
    title: "কম্পিউটার ল্যাব",
    category: "শ্রেণিকক্ষ",
  },
  {
    src: "https://picsum.photos/seed/bdcampus3/600/600.jpg",
    title: "খেলার মাঠ",
    category: "ক্যাম্পাস",
  },
  {
    src: "https://picsum.photos/seed/bdevent2/600/600.jpg",
    title: "বিজ্ঞান মেলা ২০২৪",
    category: "অনুষ্ঠান",
  },
  {
    src: "https://picsum.photos/seed/bdsport2/600/600.jpg",
    title: "ফুটবল প্রতিযোগিতা",
    category: "খেলাধুলা",
  },
  {
    src: "https://picsum.photos/seed/bdclass2/600/600.jpg",
    title: "বিজ্ঞানাগার",
    category: "শ্রেণিকক্ষ",
  },
  {
    src: "https://picsum.photos/seed/bdcampus4/600/600.jpg",
    title: "অডিটোরিয়াম",
    category: "ক্যাম্পাস",
  },
  {
    src: "https://picsum.photos/seed/bdevent3/600/600.jpg",
    title: "স্বাধীনতা দিবস উদযাপন",
    category: "অনুষ্ঠান",
  },
  {
    src: "https://picsum.photos/seed/bdclass3/600/600.jpg",
    title: "শ্রেণিকক্ষে পাঠদান",
    category: "শ্রেণিকক্ষ",
  },
];

const filteredGallery = computed(() => {
  if (galleryFilter.value === "সকল") return galleryImages;
  return galleryImages.filter((img) => img.category === galleryFilter.value);
});

const govLinks = [
  {
    name: "শিক্ষা মন্ত্রণালয়",
    icon: "fas fa-landmark",
    url: "https://www.moedu.gov.bd/",
  },
  {
    name: "বাংলাদেশ মাদরাসা শিক্ষা বোর্ড",
    icon: "fas fa-graduation-cap",
    url: "http://www.bmeb.gov.bd/",
  },
  {
    name: "মাদরাসা শিক্ষা বোর্ড",
    icon: "fas fa-book-reader",
    url: "https://bmeb.ebmeb.gov.bd/",
  },
  {
    name: "বাংলাদেশ সরকার",
    icon: "fas fa-flag",
    url: "https://bangladesh.gov.bd/",
  },
  {
    name: "ভর্তি আবেদন",
    icon: "fas fa-user-plus",
    url: "http://admission.example.com/",
  },
  {
    name: "ফলাফল",
    icon: "fas fa-chart-bar",
    url: "http://www.eboardresults.com/",
  },
];

const contactInfo = [
  {
    icon: "fas fa-map-marker-alt",
    label: "ঠিকানা",
    value: "বানিয়াবাড়ী, মাহমুদপুর, মেলান্দহ, জামালপুর",
  },
  {
    icon: "fas fa-location-dot",
    label: "অবস্থান",
    value: "মেলান্দহ উপজেলা, জামালপুর জেলা, ময়মনসিংহ বিভাগ",
  },
  {
    icon: "fas fa-phone",
    label: "মোবাইল",
    value: "০১৫১৮৩৬৬১৭৮",
  },
  {
    icon: "fas fa-envelope",
    label: "ইমেইল",
    value: "pbm@yahoo.com",
  },
  {
    icon: "fas fa-id-card",
    label: "EIIN",
    value: "110124",
  },
  {
    icon: "fas fa-calendar-check",
    label: "প্রতিষ্ঠিত",
    value: "১ জানুয়ারি ১৯৪৯",
  },
];

const dynamicContactInfo = computed(() => [
  {
    icon: "fas fa-map-marker-alt",
    label: "ঠিকানা",
    value: schoolSettings.value.address,
  },
  {
    icon: "fas fa-location-dot",
    label: "অবস্থান",
    value: schoolSettings.value.address,
  },
  {
    icon: "fas fa-phone",
    label: "মোবাইল",
    value: schoolSettings.value.phone,
  },
  {
    icon: "fas fa-envelope",
    label: "ইমেইল",
    value: schoolSettings.value.email,
  },
  {
    icon: "fas fa-id-card",
    label: "EIIN",
    value: schoolSettings.value.eiin,
  },
  {
    icon: "fas fa-calendar-check",
    label: "প্রতিষ্ঠিত",
    value: "১ জানুয়ারি ১৯৪৯",
  },
]);

// Methods
const loadPublicData = async () => {
  try {
    const data = await api.publicData();
    if (data.settings) {
      schoolSettings.value = {
        ...schoolSettings.value,
        ...data.settings,
      };
    }
    if (schoolSettings.value.breaking_news) {
      breakingNews.value = `📢 ${schoolSettings.value.breaking_news}`;
    }
    if (Array.isArray(data.notices)) {
      notices.value = data.notices.map((notice) => ({
        ...notice,
        date: notice.published_at,
        urgent: Boolean(notice.urgent),
      }));
    }
    if (data.source === "backend" && Array.isArray(data.teachers)) {
      teachers.value = data.teachers;
      if (!teacherFilters.value.includes(teacherFilter.value))
        teacherFilter.value = "সকল";
    }
    if (Array.isArray(data.events)) {
      events.value = data.events.map((event) => {
        const date = parseEventDate(event.event_date);
        return {
          ...event,
          day: date
            ? date.toLocaleDateString("bn-BD", {
                day: "numeric",
              })
            : "",
          month: date ? monthNames[date.getMonth()].slice(0, 4) : "",
          title: event.title,
          time: event.start_time
            ? String(event.start_time).slice(0, 5)
            : "সময় নির্ধারিত হবে",
        };
      });
      const firstEventDate = events.value
        .map((event) => parseEventDate(event.event_date))
        .find(Boolean);
      if (firstEventDate) {
        currentMonth.value = firstEventDate.getMonth();
        currentYear.value = firstEventDate.getFullYear();
      }
    }
    if (data.source === "backend" && data.academic) {
      academicData.value = {
        levels: Array.isArray(data.academic.levels) ? data.academic.levels : [],
        classes: Array.isArray(data.academic.classes)
          ? data.academic.classes
          : [],
        sections: Array.isArray(data.academic.sections)
          ? data.academic.sections
          : [],
        shifts: Array.isArray(data.academic.shifts) ? data.academic.shifts : [],
      };
      if (
        !academicTabs.value.some((tab) => tab.id === activeAcademicTab.value)
      ) {
        activeAcademicTab.value = "all";
      }
    }
  } catch (error) {
    console.warn(
      "Public data API unavailable, using bundled fallback data.",
      error,
    );
  } finally {
    academicLoading.value = false;
  }
};

const toggleDark = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark");
};

const showToast = (message, type = "info") => {
  const id = ++toastId;
  toasts.value.push({
    id,
    message,
    type,
  });
  setTimeout(() => removeToast(id), 4000);
};

const removeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

const openNotice = (notice) => {
  selectedNotice.value = notice;
  showNoticeModal.value = true;
};

const showNoticeArchive = () => {
  window.location.assign("/notices");
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const printNotice = () => {
  const notice = selectedNotice.value;
  const content =
    notice.detail_html ||
    `<p>${escapeHtml(notice.detail).replace(/\n/g, "<br>")}</p>`;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.opener = null;

  printWindow.document.write(`<!doctype html>
              <html><head><title>${escapeHtml(notice.title)}</title>

<style>
@page {
    size: A4;
    margin: 22mm;
}

body {
    font-family: Arial, 'Noto Sans Bengali', sans-serif;
    color: #172033;
    line-height: 1.7;
}

header {
    border-bottom: 2px solid #167044;
    margin-bottom: 24px;
    padding-bottom: 14px;
}

h1 {
    margin: 8px 0;
    font-size: 24px;
}

.meta {
    color: #526274;
    font-size: 13px;
}

article p {
    margin: 0 0 14px;
}

article ul,
article ol {
    padding-left: 26px;
    margin: 0 0 14px;
}

article table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
}

article th,
article td {
    border: 1px solid #94a3b8;
    padding: 8px;
    text-align: left;
}

article a {
    color: #0f766e;
}

footer {
    border-top: 1px solid #cbd5e1;
    color: #64748b;
    font-size: 11px;
    margin-top: 36px;
    padding-top: 10px;
}
</style></head><body>
              <header><div class="meta">${escapeHtml(notice.category)} | ${escapeHtml(notice.date)}</div><h1>${escapeHtml(notice.title)}</h1></header>
              <article>${content}</article><footer>Printed from the School Management System</footer>
              </body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => printWindow.print(), 250);
};

const openGalleryModal = (index) => {
  galleryIndex.value = index;
  showGalleryModal.value = true;
};

const prevGalleryImg = () => {
  galleryIndex.value =
    (galleryIndex.value - 1 + filteredGallery.value.length) %
    filteredGallery.value.length;
};

const nextGalleryImg = () => {
  galleryIndex.value = (galleryIndex.value + 1) % filteredGallery.value.length;
};

const checkResult = () => {
  if (
    !resultSearch.value.exam ||
    !resultSearch.value.year ||
    !resultSearch.value.roll
  ) {
    showToast("সকল তথ্য পূরণ করুন", "warning");
    return;
  }
  const names = [
    "মো: রাহুল ইসলাম",
    "মোসা: নুসরাত জাহান",
    "মো: তানভীর আহমেদ",
    "মোসা: সাদিয়া আক্তার",
    "মো: ফারহান হোসেন",
  ];
  const gpas = ["৫.০০", "৪.৮৯", "৪.৭৫", "৪.৬৩", "৫.০০"];
  const grades = ["A+", "A+", "A+", "A+", "A+"];
  const idx = Math.floor(Math.random() * 5);
  resultData.value = {
    name: names[idx],
    roll: resultSearch.value.roll,
    exam: resultSearch.value.exam,
    year: resultSearch.value.year,
    gpa: gpas[idx],
    grade: grades[idx],
  };
  showToast("ফলাফল প্রদর্শিত হচ্ছে", "success");
};

const submitContact = () => {
  contactSending.value = true;
  setTimeout(() => {
    contactSending.value = false;
    contactForm.value = {
      name: "",
      phone: "",
      email: "",
      subject: "",
      message: "",
    };
    showToast("আপনার মেসেজ সফলভাবে পাঠানো হয়েছে!", "success");
  }, 1500);
};

const submitAdmission = async () => {
  admSending.value = true;
  try {
    await api.submitAdmission({
      student_name: admForm.value.name,
      father_name: admForm.value.father,
      mother_name: admForm.value.mother,
      date_of_birth: admForm.value.dob,
      class_name: admForm.value.class,
      department: admForm.value.department,
      phone: admForm.value.phone,
      previous_gpa: admForm.value.gpa,
    });
    admSending.value = false;
    showAdmissionModal.value = false;
    admForm.value = {
      name: "",
      father: "",
      mother: "",
      dob: "",
      class: "",
      department: "",
      phone: "",
      gpa: "",
    };
    showToast(
      "আবেদন সফলভাবে জমা হয়েছে! ভর্তি পোর্টালতে চূড়ান্ত আবেদন করুন।",
      "success",
    );
  } catch (error) {
    admSending.value = false;
    showToast(error.message || "আবেদন জমা দেওয়া যায়নি", "warning");
  }
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

// Scroll handler
const handleScroll = () => {
  scrolled.value = window.scrollY > 50;

  // Active section detection
  const sections = navItems.map((n) => n.id);
  for (let i = sections.length - 1; i >= 0; i--) {
    const el = document.getElementById(sections[i]);
    if (el && window.scrollY >= el.offsetTop - 200) {
      activeSection.value = sections[i];
      break;
    }
  }
};

// Intersection Observer for section reveals
const observeSections = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  document
    .querySelectorAll(".section-reveal")
    .forEach((el) => observer.observe(el));
};

onMounted(() => {
  loadPublicData();
  window.addEventListener("scroll", handleScroll);
  handleScroll();
  setTimeout(observeSections, 100);
  showToast(
    `স্বাগতম! ${schoolSettings.value.name_bn} এ আপনাকে স্বাগতম।`,
    "success",
  );
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style>
[v-cloak] {
  display: none !important;
}

* {
  scrollbar-width: thin;
  scrollbar-color: #16a34a #f0fdf4;
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f0fdf4;
}

::-webkit-scrollbar-thumb {
  background: #16a34a;
  border-radius: 4px;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-12px);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideLeft {
  from {
    opacity: 0;
    transform: translateX(40px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(-40px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes pulse-green {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4);
  }

  70% {
    box-shadow: 0 0 0 15px rgba(22, 163, 74, 0);
  }
}

@keyframes marquee {
  0% {
    transform: translateX(100%);
  }

  100% {
    transform: translateX(-100%);
  }
}

@keyframes countUp {
  from {
    opacity: 0;
    transform: scale(0.5);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }

  100% {
    background-position: 200% 0;
  }
}

@keyframes borderGlow {
  0%,
  100% {
    border-color: rgba(22, 163, 74, 0.3);
  }

  50% {
    border-color: rgba(22, 163, 74, 0.8);
  }
}

.anim-float {
  animation: float 3s ease-in-out infinite;
}

.anim-slide-up {
  animation: slideUp 0.8s ease-out forwards;
}

.anim-slide-left {
  animation: slideLeft 0.8s ease-out forwards;
}

.anim-slide-right {
  animation: slideRight 0.8s ease-out forwards;
}

.anim-fade {
  animation: fadeIn 0.6s ease-out forwards;
}

.anim-pulse-green {
  animation: pulse-green 2s infinite;
}

.anim-marquee {
  animation: marquee 20s linear infinite;
}

.anim-count {
  animation: countUp 0.6s ease-out forwards;
}

.anim-shimmer {
  background: linear-gradient(
    90deg,
    transparent 30%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 70%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

.anim-border-glow {
  animation: borderGlow 2s ease-in-out infinite;
}

.hero-bg {
  background: linear-gradient(
    135deg,
    #052e16 0%,
    #14532d 30%,
    #166534 60%,
    #15803d 100%
  );
  position: relative;
  overflow: hidden;
}

.hero-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.hero-bg::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(to top, #ffffff, transparent);
}

.glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.glass-white {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.card-hover {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-hover:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 50px -12px rgba(22, 163, 74, 0.2);
}

.nav-link {
  position: relative;
}

.nav-link::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 50%;
  width: 0;
  height: 2px;
  background: #16a34a;
  transition: all 0.3s;
  transform: translateX(-50%);
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}

.notice-item {
  border-left: 3px solid transparent;
  transition: all 0.3s;
}

.notice-item:hover {
  border-left-color: #16a34a;
  background: #f0fdf4;
  transform: translateX(4px);
}

.tab-btn {
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.tab-btn.active {
  background: #16a34a;
  color: white;
}

.tab-btn::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.5s;
  transform: translate(-50%, -50%);
}

.tab-btn:active::before {
  width: 300px;
  height: 300px;
}

.step-line {
  position: relative;
}

.step-line::after {
  content: "";
  position: absolute;
  top: 24px;
  left: 24px;
  width: 2px;
  height: calc(100% - 24px);
  background: linear-gradient(to bottom, #16a34a, #bbf7d0);
}

.step-line:last-child::after {
  display: none;
}

.teacher-card {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.teacher-card:hover {
  transform: scale(1.03);
}

.teacher-card:hover .teacher-overlay {
  opacity: 1;
}

.teacher-overlay {
  opacity: 0;
  transition: opacity 0.4s;
}

.toast-enter {
  animation: slideLeft 0.4s ease-out;
}

.toast-leave {
  animation: slideRight 0.4s ease-in reverse;
}

.modal-overlay {
  transition: opacity 0.3s;
}

.modal-content {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.gradient-text {
  background: linear-gradient(135deg, #16a34a, #15803d, #ca8a04);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.section-reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

.marquee-container {
  overflow: hidden;
  white-space: nowrap;
}

.result-card {
  transition: all 0.3s;
  cursor: pointer;
}

.result-card:hover {
  transform: scale(1.02);
  border-color: #16a34a;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
}

/* Vue transition helpers */
.fade-enter-active,
.fade-leave-active,
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@media (max-width: 768px) {
  .hero-bg::after {
    height: 60px;
  }
}
</style>
