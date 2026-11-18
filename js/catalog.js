
(function () {
  "use strict";

  /*
   * FATHKIT CATALOG SYSTEM
   * Membaca data tools dan kategori yang sudah tersedia.
   * Tidak menghapus atau mengganti data tools lama.
   */

  const state = {
    tools: [],
    categories: [],
    activeCategory: "all",
    searchQuery: ""
  };

  function getSourceTools() {
    if (Array.isArray(window.FATHKIT_TOOLS)) {
      return window.FATHKIT_TOOLS;
    }

    if (Array.isArray(window.tools)) {
      return window.tools;
    }

    if (Array.isArray(window.TOOLS)) {
      return window.TOOLS;
    }

    return [];
  }

  function getSourceCategories() {
    if (Array.isArray(window.FATHKIT_CATEGORIES)) {
      return window.FATHKIT_CATEGORIES;
    }

    if (Array.isArray(window.categories)) {
      return window.categories;
    }

    if (Array.isArray(window.CATEGORIES)) {
      return window.CATEGORIES;
    }

    return [];
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function normalizeCategory(category) {
    if (typeof category === "string") {
      return {
        id: normalizeText(category).replace(/\s+/g, "-"),
        name: category.trim(),
        description: ""
      };
    }

    if (!category || typeof category !== "object") {
      return null;
    }

    const name =
      category.name ||
      category.title ||
      category.label ||
      category.id ||
      "";

    if (!name) return null;

    return {
      id: String(category.id || normalizeText(name).replace(/\s+/g, "-")),
      name: String(name),
      description: String(category.description || "")
    };
  }

  function normalizeTool(tool) {
    if (!tool || typeof tool !== "object") return null;

    const id = String(tool.id || "").trim();
    const name = String(tool.name || tool.title || "").trim();

    if (!id || !name) return null;

    const categoryValue =
      tool.category ||
      tool.categoryId ||
      tool.category_id ||
      "Lainnya";

    let categoryName = "Lainnya";

    if (typeof categoryValue === "string") {
      categoryName = categoryValue;
    } else if (categoryValue && typeof categoryValue === "object") {
      categoryName =
        categoryValue.name ||
        categoryValue.title ||
        categoryValue.id ||
        "Lainnya";
    }

    return {
      ...tool,
      id: id,
      name: name,
      description: String(tool.description || ""),
      category: categoryName,
      tags: Array.isArray(tool.tags) ? tool.tags : [],
      searchText: normalizeText([
        name,
        tool.description,
        categoryName,
        ...(Array.isArray(tool.tags) ? tool.tags : [])
      ].join(" "))
    };
  }

  function refresh() {
    const rawTools = getSourceTools();
    const rawCategories = getSourceCategories();

    state.tools = rawTools
      .map(normalizeTool)
      .filter(Boolean);

    const categoryMap = new Map();

    rawCategories
      .map(normalizeCategory)
      .filter(Boolean)
      .forEach(function (category) {
        categoryMap.set(
          normalizeText(category.name),
          category
        );
      });

    state.tools.forEach(function (tool) {
      const key = normalizeText(tool.category);

      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          id: key.replace(/\s+/g, "-") || "lainnya",
          name: tool.category,
          description: ""
        });
      }
    });

    state.categories = Array.from(categoryMap.values());

    window.dispatchEvent(
      new CustomEvent("fathkit:catalog-updated", {
        detail: {
          totalTools: state.tools.length,
          totalCategories: state.categories.length
        }
      })
    );

    return getStats();
  }

  function getStats() {
    return {
      totalTools: state.tools.length,
      totalCategories: state.categories.length,
      activeCategory: state.activeCategory,
      searchQuery: state.searchQuery
    };
  }

  function getCategories() {
    return state.categories.map(function (category) {
      const count = state.tools.filter(function (tool) {
        return normalizeText(tool.category) ===
          normalizeText(category.name);
      }).length;

      return {
        ...category,
        count: count
      };
    });
  }

  function getAll() {
    return state.tools.map(function (tool) {
      return { ...tool };
    });
  }

  function getById(id) {
    const tool = state.tools.find(function (item) {
      return item.id === String(id);
    });

    return tool ? { ...tool } : null;
  }

  function getByCategory(category) {
    const key = normalizeText(category);

    return state.tools
      .filter(function (tool) {
        return normalizeText(tool.category) === key;
      })
      .map(function (tool) {
        return { ...tool };
      });
  }

  function search(query) {
    state.searchQuery = String(query || "").trim();

    const key = normalizeText(state.searchQuery);

    return state.tools
      .filter(function (tool) {
        return !key || tool.searchText.includes(key);
      })
      .map(function (tool) {
        return { ...tool };
      });
  }

  function filter(options) {
    const settings = options || {};

    const query = normalizeText(
      settings.query !== undefined
        ? settings.query
        : state.searchQuery
    );

    const category = normalizeText(
      settings.category !== undefined
        ? settings.category
        : state.activeCategory
    );

    state.searchQuery = settings.query !== undefined
      ? String(settings.query || "").trim()
      : state.searchQuery;

    state.activeCategory = settings.category !== undefined
      ? String(settings.category || "all")
      : state.activeCategory;

    return state.tools.filter(function (tool) {
      const matchesSearch =
        !query || tool.searchText.includes(query);

      const matchesCategory =
        !category ||
        category === "all" ||
        category === "semua" ||
        normalizeText(tool.category) === category;

      return matchesSearch && matchesCategory;
    }).map(function (tool) {
      return { ...tool };
    });
  }

  function reset() {
    state.activeCategory = "all";
    state.searchQuery = "";

    return filter({
      category: "all",
      query: ""
    });
  }

  function getFeatured(limit) {
    const amount = Math.max(1, Number(limit) || 6);

    return state.tools
      .filter(function (tool) {
        return tool.featured === true ||
          tool.isFeatured === true;
      })
      .slice(0, amount)
      .map(function (tool) {
        return { ...tool };
      });
  }

  function getPopular(limit) {
    const amount = Math.max(1, Number(limit) || 6);

    return state.tools
      .filter(function (tool) {
        return tool.popular === true ||
          tool.isPopular === true;
      })
      .slice(0, amount)
      .map(function (tool) {
        return { ...tool };
      });
  }

  function getByStatus(status) {
    const key = normalizeText(status);

    return state.tools
      .filter(function (tool) {
        return normalizeText(tool.status) === key;
      })
      .map(function (tool) {
        return { ...tool };
      });
  }

  window.FATHKIT_CATALOG = {
    refresh: refresh,
    stats: getStats,
    getAll: getAll,
    getById: getById,
    getCategories: getCategories,
    getByCategory: getByCategory,
    search: search,
    filter: filter,
    reset: reset,
    getFeatured: getFeatured,
    getPopular: getPopular,
    getByStatus: getByStatus
  };

  refresh();
})();
