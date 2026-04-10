/**
 * DOM manipulation helper utilities
 */

/**
 * Create a DOM element with properties and children
 * @param {string} tag - HTML tag name
 * @param {object} [props={}] - Element properties (className, id, textContent, etc.)
 * @param {Array<Node|string>} [children=[]] - Child nodes or text
 * @returns {HTMLElement}
 */
export function createElement(tag, props = {}, children = []) {
  const element = document.createElement(tag);

  // Apply properties
  for (const [key, value] of Object.entries(props)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      // Event listeners: onClick -> click
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element[key] = value;
    }
  }

  // Append children
  appendChildren(element, children);

  return element;
}

/**
 * Add a class to an element
 * @param {HTMLElement} element
 * @param {string} className
 */
export function addClass(element, className) {
  if (!element || !className) return;
  element.classList.add(className);
}

/**
 * Remove a class from an element
 * @param {HTMLElement} element
 * @param {string} className
 */
export function removeClass(element, className) {
  if (!element || !className) return;
  element.classList.remove(className);
}

/**
 * Toggle a class on an element
 * @param {HTMLElement} element
 * @param {string} className
 * @returns {boolean} true if class is now present
 */
export function toggleClass(element, className) {
  if (!element || !className) return false;
  return element.classList.toggle(className);
}

/**
 * Append multiple children to a parent element
 * @param {HTMLElement} parent
 * @param {Array<Node|string>} children
 */
export function appendChildren(parent, children) {
  if (!parent || !Array.isArray(children)) return;

  for (const child of children) {
    if (child instanceof Node) {
      parent.appendChild(child);
    } else if (typeof child === 'string') {
      parent.appendChild(document.createTextNode(child));
    }
  }
}
