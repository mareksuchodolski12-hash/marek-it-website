/**
 * @fileoverview Main application controller for interactive UI features
 * @version 2.0.0
 * @author Enterprise Dev Team
 *
 * Production-grade interactive features with:
 * - Strict error handling & validation
 * - Performance optimization (debouncing, caching)
 * - Accessibility compliance (WCAG 2.1)
 * - Type safety & JSDoc documentation
 * - Comprehensive logging & monitoring
 * - Zero XSS vulnerabilities
 * - Memory leak prevention
 * - Event listener cleanup
 * - Browser compatibility
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * @typedef {Object} SimulatorInputs
 * @property {number} teamSize - Number of team members
 * @property {number} decisions - Weekly decisions count
 * @property {number} manualHours - Manual work hours per week
 * @property {number} hourlyRate - Hourly rate in EUR
 */

/**
 * @typedef {Object} SimulatorResults
 * @property {number} monthlyHours - Monthly hours (4 weeks)
 * @property {number} monthlyCost - Monthly cost in EUR
 * @property {number} optimizedCost - Cost after 40% optimization
 * @property {number} savings - Savings in EUR
 */

/**
 * @typedef {Object} DashboardInsight
 * @property {string} title - Insight title with emoji
 * @property {string} text - Detailed insight text
 */

/**
 * @typedef {Object} ModuleLifecycle
 * @property {Function} initialize - Initialize module
 * @property {Function} [destroy] - Cleanup resources
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const CONFIG = {
  animation: {
    fadeInDuration: 600,
    debounceDelay: 300,
    scrollThreshold: 0.1,
  },
  simulator: {
    weeksPerMonth: 4,
    optimizationPercentage: 0.4,
  },
  selectors: {
    anchors: 'a[href^="#"]',
    animatedElements: '.case-card, .audience-item, .step',
    clickableStats: '.clickable-stat',
    simulatorInputs: {
      teamSize: '#team-size',
      decisions: '#decisions',
      manualHours: '#manual-hours',
      hourlyRate: '#hourly-rate',
    },
    simulatorOutputs: {
      teamSizeValue: '#team-size-value',
      decisionsValue: '#decisions-value',
      manualHoursValue: '#manual-hours-value',
      hourlyRateValue: '#hourly-rate-value',
      monthlyHours: '#monthly-hours',
      monthlyCost: '#monthly-cost',
      optimizedCost: '#optimized-cost',
    },
    dashboard: {
      insight: '#dashboard-insight',
    },
    personalization: {
      industrySelect: '#industry-select',
      teamSizeSelect: '#team-size-select',
      problemSelect: '#problem-select',
      result: '#personalization-result',
      text: '#personalization-text',
    },
  },
  locale: {
    currency: 'EUR',
    currencySymbol: '€',
    language: 'pl-PL',
  },
} as const;

// ============================================================================
// LOGGER UTILITY
// ============================================================================

/**
 * Enhanced logger with context and levels
 */
const Logger = (() => {
  const levels = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
  };

  /**
   * Log message with context
   * @param {string} level - Log level
   * @param {string} context - Context/module name
   * @param {string} message - Log message
   * @param {any} [data] - Additional data
   */
  function log(level, context, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${context}]`;

    if (data !== undefined) {
      console[level](`${prefix} ${message}`, data);
    } else {
      console[level](`${prefix} ${message}`);
    }
  }

  return {
    debug: (context, message, data) => log(levels.DEBUG, context, message, data),
    info: (context, message, data) => log(levels.INFO, context, message, data),
    warn: (context, message, data) => log(levels.WARN, context, message, data),
    error: (context, message, data) => log(levels.ERROR, context, message, data),
  };
})();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safe DOM element selection with error handling
 * @param {string} selector - CSS selector
 * @param {HTMLElement} [context=document] - Context element
 * @returns {HTMLElement|null} Element or null if not found
 */
function selectElement(selector, context = document) {
  if (!selector || typeof selector !== 'string') {
    Logger.warn('selectElement', 'Invalid selector', selector);
    return null;
  }

  try {
    return context.querySelector(selector);
  } catch (error) {
    Logger.error('selectElement', `Failed to select "${selector}"`, error);
    return null;
  }
}

/**
 * Safe multiple element selection
 * @param {string} selector - CSS selector
 * @param {HTMLElement} [context=document] - Context element
 * @returns {HTMLElement[]} Array of elements
 */
function selectElements(selector, context = document) {
  if (!selector || typeof selector !== 'string') {
    Logger.warn('selectElements', 'Invalid selector', selector);
    return [];
  }

  try {
    return Array.from(context.querySelectorAll(selector));
  } catch (error) {
    Logger.error('selectElements', `Failed to select "${selector}"`, error);
    return [];
  }
}

/**
 * Format number with locale-specific formatting
 * @param {number} value - Number to format
 * @param {Object} [options] - Formatting options
 * @returns {string} Formatted number
 */
function formatNumber(value, options = {}) {
  const {
    style = 'decimal',
    currency = CONFIG.locale.currency,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;

  try {
    const formatter = new Intl.NumberFormat(CONFIG.locale.language, {
      style,
      currency: style === 'currency' ? currency : undefined,
      minimumFractionDigits,
      maximumFractionDigits,
    });
    return formatter.format(value);
  } catch (error) {
    Logger.error('formatNumber', 'Formatting failed', error);
    return String(value);
  }
}

/**
 * Debounce function to limit execution frequency
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function with cancel method
 */
function debounce(fn, delay = CONFIG.animation.debounceDelay) {
  if (typeof fn !== 'function') {
    throw new Error('debounce: First argument must be a function');
  }

  let timeoutId = null;

  const debounced = function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };

  /**
   * Cancel pending execution
   */
  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };

  return debounced;
}

/**
 * Throttle function to limit execution frequency
 * @param {Function} fn - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function with cancel method
 */
function throttle(fn, delay = CONFIG.animation.debounceDelay) {
  if (typeof fn !== 'function') {
    throw new Error('throttle: First argument must be a function');
  }

  let lastCall = 0;
  let timeoutId = null;

  const throttled = function (...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, delay - timeSinceLastCall);
    }
  };

  /**
   * Cancel pending execution
   */
  throttled.cancel = () => {
    clearTimeout(timeoutId);
  };

  return throttled;
}

/**
 * Animate number from current to target value
 * @param {HTMLElement} element - Target element
 * @param {number} targetValue - Target number value
 * @param {string} [prefix=''] - Prefix (e.g., '€')
 * @param {string} [suffix=''] - Suffix (e.g., 'h')
 * @param {number} [duration=600] - Animation duration in ms
 * @returns {Promise<void>} Completes when animation finishes
 */
function animateNumberValue(
  element,
  targetValue,
  prefix = '',
  suffix = '',
  duration = CONFIG.animation.fadeInDuration
) {
  return new Promise((resolve) => {
    if (!element || !Number.isFinite(targetValue)) {
      Logger.warn('animateNumberValue', 'Invalid parameters', { element, targetValue });
      resolve();
      return;
    }

    const startValue = parseInt(element.textContent?.replace(/\D/g, '') || '0');
    const startTime = performance.now();
    const difference = targetValue - startValue;
    let animationFrameId = null;

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: easeOutQuad
      const easeProgress = 1 - (1 - progress) ** 2;
      const currentValue = Math.round(startValue + difference * easeProgress);

      const formatted = formatNumber(currentValue);
      element.textContent = `${prefix}${formatted}${suffix}`;

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    animationFrameId = requestAnimationFrame(animate);

    // Allow cancellation via AbortController if needed
    return () => cancelAnimationFrame(animationFrameId);
  });
}

/**
 * Check if IntersectionObserver is supported
 * @returns {boolean} True if supported
 */
function isIntersectionObserverSupported() {
  return 'IntersectionObserver' in window;
}

/**
 * Safely set text content (XSS safe)
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text content
 */
function setText(element, text) {
  if (!element) {
    Logger.warn('setText', 'Element is null or undefined');
    return;
  }

  try {
    element.textContent = text;
  } catch (error) {
    Logger.error('setText', 'Failed to set text', error);
  }
}

/**
 * Safely clear text content
 * @param {HTMLElement} element - Target element
 */
function clearContent(element) {
  if (!element) {
    Logger.warn('clearContent', 'Element is null or undefined');
    return;
  }

  element.textContent = '';
}

/**
 * Event listener manager for cleanup
 */
class EventListenerManager {
  constructor() {
    this.listeners = [];
  }

  /**
   * Add listener and track for cleanup
   * @param {HTMLElement} element - Target element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object} [options] - Event options
   */
  add(element, event, handler, options) {
    if (!element) {
      Logger.warn('EventListenerManager', 'Element is null');
      return;
    }

    element.addEventListener(event, handler, options);
    this.listeners.push({ element, event, handler, options });
  }

  /**
   * Remove all tracked listeners
   */
  removeAll() {
    this.listeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.listeners = [];
  }
}

// ============================================================================
// INTERSECTION OBSERVER SETUP
// ============================================================================

/**
 * Initialize scroll animations with Intersection Observer
 */
function initializeScrollAnimations() {
  if (!isIntersectionObserverSupported()) {
    Logger.warn('initializeScrollAnimations', 'IntersectionObserver not supported, using fallback');
    // Fallback: show all animated elements immediately
    selectElements(CONFIG.selectors.animatedElements).forEach((el) => {
      el.style.opacity = '1';
      el.style.animation = 'fadeInDown 0.6s ease-out forwards';
    });
    return;
  }

  const observerOptions = {
    threshold: CONFIG.animation.scrollThreshold,
    rootMargin: '0px 0px -100px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const target = entry.target;

      // Apply animation
      target.style.opacity = '1';
      target.style.animation = `fadeInDown ${CONFIG.animation.fadeInDuration}ms ease-out forwards`;

      // Unobserve after animation
      observer.unobserve(target);
    });
  }, observerOptions);

  // Observe all animated elements
  const elements = selectElements(CONFIG.selectors.animatedElements);
  elements.forEach((element) => {
    element.style.opacity = '0';
    observer.observe(element);
  });

  Logger.info('initializeScrollAnimations', `Initialized for ${elements.length} elements`);

  return observer;
}

// ============================================================================
// SMOOTH SCROLL HANDLER
// ============================================================================

/**
 * Initialize smooth scroll for anchor links
 * @returns {EventListenerManager} Manager for cleanup
 */
function initializeSmoothScroll() {
  const listenerManager = new EventListenerManager();
  const anchors = selectElements(CONFIG.selectors.anchors);

  anchors.forEach((anchor) => {
    listenerManager.add(anchor, 'click', handleAnchorClick);
  });

  Logger.info('initializeSmoothScroll', `Initialized ${anchors.length} anchors`);

  return listenerManager;
}

/**
 * Handle anchor link click
 * @param {MouseEvent} event - Click event
 */
function handleAnchorClick(event) {
  const href = this.getAttribute('href');

  if (!href || !href.startsWith('#')) {
    return;
  }

  event.preventDefault();

  const targetSelector = href;
  const targetElement = selectElement(targetSelector);

  if (!targetElement) {
    Logger.warn('handleAnchorClick', `Target not found: ${targetSelector}`);
    return;
  }

  try {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  } catch (error) {
    Logger.error('handleAnchorClick', 'Scroll failed', error);
  }
}

// ============================================================================
// SIMULATOR MODULE
// ============================================================================

/**
 * Simulator module for cost calculation
 */
const SimulatorModule = (() => {
  let inputs = {
    teamSize: 5,
    decisions: 20,
    manualHours: 40,
    hourlyRate: 50,
  };

  let listenerManager = new EventListenerManager();

  /**
   * Calculate simulator results
   * @param {Object} newInputs - Input values
   * @returns {Object} Calculation results
   */
  function calculate(newInputs) {
    const validated = validateInputs(newInputs);
    inputs = validated;

    const monthlyHours = validated.manualHours * CONFIG.simulator.weeksPerMonth;
    const monthlyCost = monthlyHours * validated.hourlyRate;
    const optimizedCost = Math.round(
      monthlyCost * (1 - CONFIG.simulator.optimizationPercentage)
    );
    const savings = monthlyCost - optimizedCost;

    return {
      monthlyHours,
      monthlyCost,
      optimizedCost,
      savings,
    };
  }

  /**
   * Validate and sanitize inputs
   * @param {Object} newInputs - Input values to validate
   * @returns {Object} Validated inputs
   */
  function validateInputs(newInputs) {
    const sanitize = (value, min = 0, max = 10000, defaultVal = 5) => {
      const num = parseInt(value, 10);
      if (!Number.isFinite(num)) return defaultVal;
      return Math.max(min, Math.min(max, num));
    };

    return {
      teamSize: sanitize(newInputs.teamSize, 1, 1000, 5),
      decisions: sanitize(newInputs.decisions, 1, 500, 20),
      manualHours: sanitize(newInputs.manualHours, 1, 200, 40),
      hourlyRate: sanitize(newInputs.hourlyRate, 10, 300, 50),
    };
  }

  /**
   * Read current input values from DOM
   * @returns {Object} Current input values
   */
  function readInputsFromDOM() {
    const selectors = CONFIG.selectors.simulatorInputs;

    const teamSizeEl = selectElement(selectors.teamSize);
    const decisionsEl = selectElement(selectors.decisions);
    const manualHoursEl = selectElement(selectors.manualHours);
    const hourlyRateEl = selectElement(selectors.hourlyRate);

    return {
      teamSize: parseInt(teamSizeEl?.value || '5'),
      decisions: parseInt(decisionsEl?.value || '20'),
      manualHours: parseInt(manualHoursEl?.value || '40'),
      hourlyRate: parseInt(hourlyRateEl?.value || '50'),
    };
  }

  /**
   * Update displayed values in DOM
   * @param {Object} displayInputs - Values to display
   */
  async function updateDisplayValues(displayInputs) {
    const outputs = CONFIG.selectors.simulatorOutputs;

    const updates = [
      { selector: outputs.teamSizeValue, value: String(displayInputs.teamSize) },
      { selector: outputs.decisionsValue, value: String(displayInputs.decisions) },
      {
        selector: outputs.manualHoursValue,
        value: String(displayInputs.manualHours),
      },
      { selector: outputs.hourlyRateValue, value: String(displayInputs.hourlyRate) },
    ];

    updates.forEach(({ selector, value }) => {
      const el = selectElement(selector);
      if (el) setText(el, value);
    });
  }

  /**
   * Update calculated results in DOM
   * @param {Object} results - Calculation results
   */
  async function updateResults(results) {
    const outputs = CONFIG.selectors.simulatorOutputs;

    const monthlyHoursEl = selectElement(outputs.monthlyHours);
    const monthlyCostEl = selectElement(outputs.monthlyCost);
    const optimizedCostEl = selectElement(outputs.optimizedCost);

    if (monthlyHoursEl) {
      await animateNumberValue(
        monthlyHoursEl,
        results.monthlyHours,
        '',
        'h',
        CONFIG.animation.fadeInDuration
      );
    }

    if (monthlyCostEl) {
      await animateNumberValue(
        monthlyCostEl,
        results.monthlyCost,
        CONFIG.locale.currencySymbol,
        '',
        CONFIG.animation.fadeInDuration
      );
    }

    if (optimizedCostEl) {
      await animateNumberValue(
        optimizedCostEl,
        results.optimizedCost,
        CONFIG.locale.currencySymbol,
        '',
        CONFIG.animation.fadeInDuration
      );
    }
  }

  /**
   * Handle simulator input change
   */
  const handleInputChange = debounce(async () => {
    const domInputs = readInputsFromDOM();
    const results = calculate(domInputs);

    await updateDisplayValues(domInputs);
    await updateResults(results);
  }, CONFIG.animation.debounceDelay);

  /**
   * Initialize simulator
   */
  function initialize() {
    const selectors = CONFIG.selectors.simulatorInputs;

    const elements = {
      teamSize: selectElement(selectors.teamSize),
      decisions: selectElement(selectors.decisions),
      manualHours: selectElement(selectors.manualHours),
      hourlyRate: selectElement(selectors.hourlyRate),
    };

    const isComplete = Object.values(elements).every((el) => el !== null);

    if (!isComplete) {
      Logger.warn('SimulatorModule', 'Not all simulator elements found');
      return false;
    }

    Object.values(elements).forEach((element) => {
      if (element) {
        listenerManager.add(element, 'input', handleInputChange);
      }
    });

    // Initial calculation
    handleInputChange();

    Logger.info('SimulatorModule', 'Initialized successfully');
    return true;
  }

  /**
   * Cleanup resources
   */
  function destroy() {
    handleInputChange.cancel();
    listenerManager.removeAll();
    Logger.info('SimulatorModule', 'Destroyed');
  }

  return {
    initialize,
    destroy,
    calculate,
    readInputsFromDOM,
  };
})();

// ============================================================================
// DASHBOARD MODULE
// ============================================================================

/**
 * Dashboard insights module
 */
const DashboardModule = (() => {
  const INSIGHTS = {
    decisions: {
      title: '🎯 Decyzje oparte na danych',
      text: 'Poprzednio decyzje zajmowały tydzień. Z systemem: masz widoczność w real-time. 127 decyzji w tym miesiącu – wszystkie wsparte danymi, nie intuicją.',
    },
    efficiency: {
      title: '⚡ Efekt: zespół pracuje szybciej',
      text: '45% wzrostu wydajności to nie magia. To automatyzacja ręcznej pracy, wyeliminowanie duplikatów i wyraźne priorytety. Drużyna może robić więcej, mniej marnując czasu.',
    },
    costs: {
      title: '💰 Koszty pod kontrolą',
      text: '€8,400 oszczędzonych w ciągu 3 miesięcy. Identyfikowaliśmy gdzie pieniądze uciekają: zbędne procesy, duplikaty, nieoptymalne narzędzia. Teraz: pełna kontrola.',
    },
    errors: {
      title: '✓ 73% mniej błędów',
      text: 'Chaos = błędy. System = jakość. Automatyzacja wyeliminowała błędy ręczne. Co zostało: tylko rzeczy, które wymagają decyzji. Reszta: flawless.',
    },
  };

  let listenerManager = new EventListenerManager();

  /**
   * Render insight safely
   * @param {Object} insight - Insight object
   * @param {HTMLElement} targetElement - Target element
   */
  function renderInsight(insight, targetElement) {
    if (!targetElement) {
      Logger.warn('DashboardModule', 'Target element not found');
      return;
    }

    clearContent(targetElement);

    const container = document.createElement('div');
    container.style.textAlign = 'left';

    const titleEl = document.createElement('h4');
    titleEl.textContent = insight.title;
    titleEl.style.color = 'var(--color-primary-light, #3b82f6)';
    titleEl.style.marginBottom = '1rem';

    const textEl = document.createElement('p');
    textEl.textContent = insight.text;
    textEl.style.color = 'var(--color-text-muted, #94a3b8)';
    textEl.style.lineHeight = '1.6';
    textEl.style.margin = '0';

    container.appendChild(titleEl);
    container.appendChild(textEl);
    targetElement.appendChild(container);

    // Announce to screen readers
    targetElement.setAttribute('role', 'status');
    targetElement.setAttribute('aria-live', 'polite');
  }

  /**
   * Handle stat click
   * @param {Event} event - Click event
   */
  function handleStatClick(event) {
    const stat = event.currentTarget;
    const insightKey = stat.dataset.insight;

    if (!insightKey || !INSIGHTS[insightKey]) {
      Logger.warn('DashboardModule', `Unknown insight: ${insightKey}`);
      return;
    }

    const insight = INSIGHTS[insightKey];
    const targetElement = selectElement(CONFIG.selectors.dashboard.insight);

    renderInsight(insight, targetElement);
  }

  /**
   * Initialize dashboard
   */
  function initialize() {
    const stats = selectElements(CONFIG.selectors.clickableStats);

    if (stats.length === 0) {
      Logger.warn('DashboardModule', 'No clickable stats found');
      return false;
    }

    stats.forEach((stat) => {
      // Ensure accessibility attributes exist
      if (!stat.getAttribute('role')) {
        stat.setAttribute('role', 'button');
      }
      if (!stat.getAttribute('tabindex')) {
        stat.setAttribute('tabindex', '0');
      }

      // Add click handler
      listenerManager.add(stat, 'click', handleStatClick);

      // Add keyboard support
      listenerManager.add(stat, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStatClick(e);
        }
      });
    });

    Logger.info('DashboardModule', `Initialized ${stats.length} stats`);
    return true;
  }

  /**
   * Cleanup resources
   */
  function destroy() {
    listenerManager.removeAll();
    Logger.info('DashboardModule', 'Destroyed');
  }

  return {
    initialize,
    destroy,
  };
})();

// ============================================================================
// PERSONALIZATION MODULE
// ============================================================================

/**
 * Personalization module for industry-specific recommendations
 */
const PersonalizationModule = (() => {
  const PLANS = {
    service: {
      chaos: 'Zaczelibyśmy od mapowania procesów (kto robi co). Potem dashboard połączony z Twoim CRM, aby każdy widział status zlecenia. Dla firmy usługowej chaos = strata klientów.',
      slow: 'System automatycznego routingu zleceń. Twój zespół widzi co ma robić, kiedy to robić. Decyzje (przydzielanie zadań) stają się automatyczne.',
      costs: 'Analiza gdzie pieniądze uciekają - nierentowne usługi, marnowanie czasu. Potem wdrażamy śledzenie rentowności per projekt.',
      growth: 'Najpierw system, potem skalowanie. Bez systemu: chaos. Z systemem: możesz zatrudnić bez zwiększenia chaosu.',
      errors: 'Szablony + checklist + automatyzacja powiadomień. 80% błędów znika dzięki procesom, pozostałe poprzez double-check.',
    },
    manufacturing: {
      chaos: 'Production planning + inventory tracking. Mapujemy linie produkcji, wąskie gardła. Potem automatyzujemy raportowanie.',
      slow: 'Real-time dashboard zleceń produkcyjnych. Eliminujemy bottlenecks w komunikacji między działami.',
      costs: 'Analiza zużycia maszynowego, strat produkcyjnych, nadprodukcji. Identyfikujemy co "pali pieniądze".',
      growth: 'System gotowy do wzrostu: przygotowany na skalowanie bez dodatkowej złożoności operacyjnej.',
      errors: 'Automatyzacja kontroli jakości, szablony procedur, logi wszystkich operacji.',
    },
    retail: {
      chaos: 'Unified inventory system. Połączenie sklepów, magazynu, online. Wszystko w jednym miejscu, zsynchronizowane real-time.',
      slow: 'Automatyzacja zamówień, rekomendacje na bazie sprzedaży, predykcja trendu. Szybciej reagujesz na zmiany popytu.',
      costs: 'Analiza co się nie sprzedaje, sezonowości, marnowania zapasów. Optymalizacja stanu magazynu = mniej zamrożonego kapitału.',
      growth: 'System przygotowany na ekspansję: nowe sklepy/kanały sprzedaży można dodawać bez bólu głowy.',
      errors: 'Synchronizacja inventory real-time, eliminacja oversell, automatyczne alerty o niedostępności.',
    },
    construction: {
      chaos: 'System planowania projektów + tracking zasobów. Mapa wszystkich zleceń, deadlines, zespołów na budowach. Koniec z chaosem na placu.',
      slow: 'Dashboard dla kierowników budowy z real-time statusem. Szybsza komunikacja między biurem a placem = szybsze decyzje.',
      costs: 'Śledzenie kosztów per projekt, analiza użycia materiałów, czasu zespołu. Odkryj gdzie pieniądze giną w piasku.',
      growth: 'Możliwość zarządzania większą liczbą projektów bez dodatkowego biura - system robi to za Ciebie.',
      errors: 'Checklist na każdym etapie budowy, dokumentacja automatyczna, eliminacja błędów wykonania.',
    },
    healthcare: {
      chaos: 'System zarządzania pacjentami + scheduling. Harmonogram wizyt, dokumentacja, przypomnienia automatyczne. Pacjenci są bardziej zadowoleni.',
      slow: 'Automatyzacja potwierdzania wizyt, wysyłania wyników, sekwencjonowania pacjentów. Więcej czasu na opiekę, mniej na papierową robotę.',
      costs: 'Optimalizacja harmonogramu gabinetów, zmniejszenie no-show dzięki automatycznym przypomnieniom, śledzenie rentowności usług.',
      growth: 'Skalowalny system dla nowych lokalizacji lub specjalizacji bez zwiększenia administracji.',
      errors: 'Zautomatyzowane sprawdzenia, brak duplikatów w dokumentacji, audyt wszystkich procedur.',
    },
    other: {
      chaos: 'Zaproponuję mapowanie Twoich konkretnych procesów i dedykowane rozwiązanie. Każda branża ma inne potrzeby - dowiedz się co dla Ciebie.',
      slow: 'Analiza gdzie tracisz czas. Potem automatyzujemy i streamlinujemy - każdy przypadek inny, warte osobnej rozmowy.',
      costs: 'Identyfikacja wycieków budżetu specyficznych dla Twojej branży. Rozmawiajmy konkretnie o Twoim biznesie.',
      growth: 'Systemy które skalują się razem z Tobą - bez eksplozji kosztów operacyjnych.',
      errors: 'Procesy i automatyzacja dostosowana do Twoich ryzyk. Chęć współpracy ponad wszystko.',
    },
  };

  let listenerManager = new EventListenerManager();

  /**
   * Validate personalization inputs
   * @param {string} industry - Selected industry
   * @param {string} teamSize - Selected team size
   * @param {string} problem - Selected problem
   * @returns {boolean} True if all inputs are valid
   */
  function validateInputs(industry, teamSize, problem) {
    return (
      Boolean(industry) &&
      Boolean(teamSize) &&
      Boolean(problem) &&
      PLANS[industry] !== undefined &&
      PLANS[industry][problem] !== undefined
    );
  }

  /**
   * Update personalization result
   */
  const handleInputChange = debounce(() => {
    const industrySelect = selectElement(CONFIG.selectors.personalization.industrySelect);
    const teamSizeSelect = selectElement(CONFIG.selectors.personalization.teamSizeSelect);
    const problemSelect = selectElement(CONFIG.selectors.personalization.problemSelect);
    const resultContainer = selectElement(CONFIG.selectors.personalization.result);
    const resultText = selectElement(CONFIG.selectors.personalization.text);

    if (!industrySelect || !teamSizeSelect || !problemSelect) {
      Logger.warn('PersonalizationModule', 'Required elements not found');
      return;
    }

    const industry = industrySelect.value;
    const teamSize = teamSizeSelect.value;
    const problem = problemSelect.value;

    if (!validateInputs(industry, teamSize, problem)) {
      if (resultContainer) {
        resultContainer.classList.remove('visible');
        resultContainer.style.display = 'none';
      }
      return;
    }

    const plan = PLANS[industry][problem];

    if (resultText) {
      setText(resultText, plan);
    }

    if (resultContainer) {
      resultContainer.classList.add('visible');
      resultContainer.style.display = 'block';
    }
  }, CONFIG.animation.debounceDelay);

  /**
   * Initialize personalization module
   */
  function initialize() {
    const industrySelect = selectElement(CONFIG.selectors.personalization.industrySelect);
    const teamSizeSelect = selectElement(CONFIG.selectors.personalization.teamSizeSelect);
    const problemSelect = selectElement(CONFIG.selectors.personalization.problemSelect);

    if (!industrySelect || !teamSizeSelect || !problemSelect) {
      Logger.warn('PersonalizationModule', 'Not all elements found');
      return false;
    }

    listenerManager.add(industrySelect, 'change', handleInputChange);
    listenerManager.add(teamSizeSelect, 'change', handleInputChange);
    listenerManager.add(problemSelect, 'change', handleInputChange);

    Logger.info('PersonalizationModule', 'Initialized successfully');
    return true;
  }

  /**
   * Cleanup resources
   */
  function destroy() {
    handleInputChange.cancel();
    listenerManager.removeAll();
    Logger.info('PersonalizationModule', 'Destroyed');
  }

  return {
    initialize,
    destroy,
  };
})();

// ============================================================================
// APP INITIALIZATION & LIFECYCLE
// ============================================================================

/**
 * Application lifecycle manager
 */
const AppLifecycle = (() => {
  let modules = [];
  let scrollAnimationObserver = null;
  let scrollListenerManager = null;

  /**
   * Initialize all modules
   */
  async function initialize() {
    Logger.info('App', '🚀 Initializing application...');

    try {
      // Initialize scroll animations first (doesn't require DOM interaction)
      scrollAnimationObserver = initializeScrollAnimations();

      // Initialize smooth scroll
      scrollListenerManager = initializeSmoothScroll();

      // Initialize feature modules
      const simulatorOk = SimulatorModule.initialize();
      const dashboardOk = DashboardModule.initialize();
      const personalizationOk = PersonalizationModule.initialize();

      if (simulatorOk) modules.push(SimulatorModule);
      if (dashboardOk) modules.push(DashboardModule);
      if (personalizationOk) modules.push(PersonalizationModule);

      Logger.info('App', '✅ Application initialized successfully');
      Logger.info('App', `📊 Modules loaded: ${modules.length}`);
    } catch (error) {
      Logger.error('App', '❌ Application initialization failed', error);
    }
  }

  /**
   * Clean up resources
   */
  function destroy() {
    Logger.info('App', '🧹 Cleaning up resources...');

    // Cleanup modules
    modules.forEach((module) => {
      if (module.destroy) {
        module.destroy();
      }
    });

    // Cleanup observers
    if (scrollAnimationObserver) {
      scrollAnimationObserver.disconnect();
    }

    // Cleanup listeners
    if (scrollListenerManager) {
      scrollListenerManager.removeAll();
    }

    modules = [];
    Logger.info('App', '✅ Cleanup complete');
  }

  return {
    initialize,
    destroy,
  };
})();

// ============================================================================
// START APPLICATION
// ============================================================================

/**
 * Determine if DOM is ready
 */
function isDOMReady() {
  return document.readyState === 'loading' ? 'loading' : 'ready';
}

if (isDOMReady() === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AppLifecycle.initialize();
  });
} else {
  AppLifecycle.initialize();
}

// ============================================================================
// CLEANUP ON PAGE UNLOAD
// ============================================================================

/**
 * Cleanup before leaving page
 */
window.addEventListener('beforeunload', () => {
  AppLifecycle.destroy();
});

/**
 * Optional: Cleanup if page is hidden (tab switch)
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    Logger.info('App', '👁️ Page hidden - pausing animations');
  } else {
    Logger.info('App', '👁️ Page visible - resuming');
  }
});

// ============================================================================
// PERFORMANCE MONITORING (optional)
// ============================================================================

/**
 * Log performance metrics
 */
if (window.performance && window.performance.timing) {
  window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    Logger.info('Performance', `Page load time: ${pageLoadTime}ms`);
  });
}

// ============================================================================
// LEAD FORM
// ============================================================================

(() => {
  const form = document.querySelector("#leadForm");
  const statusEl = document.querySelector("#leadStatus");
  const submitBtn = document.querySelector("#leadSubmit");

  console.log("[Lead Form] Initializing...", { form: !!form, statusEl: !!statusEl, submitBtn: !!submitBtn });
  if (!form) {
    console.error("[Lead Form] Form #leadForm not found!");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("[Lead Form] Submit triggered");
    statusEl.textContent = "";
    statusEl.className = "form-status";
    submitBtn.disabled = true;
    submitBtn.textContent = "Wysyłam...";

    const data = {
      industry: form.industry.value,
      problem: form.problem.value,
      tools: form.tools.value || "",
      message: form.message.value,
      contact: form.contact.value,
      website: form.website?.value || "",
      wantsMvp: form.wantsMvp?.checked || false,
      wantsAutomation: form.wantsAutomation?.checked || false,
    };

    console.log("[Lead Form] Data:", data);

    try {
      console.log("[Lead Form] Fetching /api/lead...");
      const r = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const out = await r.json().catch(() => ({}));
      console.log("[Lead Form] Response:", { status: r.status, ok: r.ok, data: out });
      if (!r.ok) throw new Error(out.error || "Błąd wysyłki");

      form.reset();
      statusEl.className = "form-status";
      statusEl.textContent = "Mam. Odpiszę w 24h. Jeśli zostawiłeś telefon — oddzwonię.";
    } catch (err) {
      statusEl.className = "form-status error";
      statusEl.textContent = "Nie poszło: " + (err?.message || "spróbuj później.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Wyślij zapytanie";
    }
  });
})();

// ============================================================================
// TO-TOP BUTTON
// ============================================================================

(() => {
  const toTopBtn = document.querySelector("#toTopBtn");

  if (!toTopBtn) return;

  const toggleVisibility = () => {
    const show = window.scrollY > 500;
    toTopBtn.style.opacity = show ? "1" : "0";
    toTopBtn.style.pointerEvents = show ? "auto" : "none";
  };

  window.addEventListener("scroll", toggleVisibility, { passive: true });
  toggleVisibility();

  toTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

// ============================================================================
// LOGO HOME ANIMATION
// ============================================================================

(() => {
  const logoHome = document.querySelector("#logoHome");
  if (!logoHome) return;

  logoHome.addEventListener("click", (e) => {
    e.preventDefault();
    
    // Dodaj klasy animacji
    logoHome.classList.add("spinning", "glow");
    
    // Scroll do góry po początkowej animacji
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 400);
    
    // Usuń klasy po animacji
    setTimeout(() => {
      logoHome.classList.remove("spinning", "glow");
    }, 800);
  });
})();
// ============================================================================
// TOPBAR SCROLL EFFECT
// ============================================================================

(() => {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;

  let ticking = false;

  const updateTopbar = () => {
    const scrolled = window.scrollY > 20;
    topbar.setAttribute("data-scrolled", scrolled ? "true" : "false");
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateTopbar);
      ticking = true;
    }
  }, { passive: true });

  // Initial check
  updateTopbar();
})();