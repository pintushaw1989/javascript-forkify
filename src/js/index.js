import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked Recipes
 */

const state = {};
// window.state = state;

/**
 * SEARCH CONTROLLER
 */

const controlSearch = async () => {
    // 1. Get query from view
    const query = searchView.getInput();
    // console.log(query);
    if (query) {
        // 2. New search object and add to state
        state.search = new Search(query);

        // 3. Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {
            // 4. Search for recipes.
            await state.search.getResults();

            // 5. Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (error) {
            clearLoader();
            alert(error);
        }
    }
};

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    // console.log(btn);
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        // console.log(goToPage);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/**
 * RECIPE CONTROLLER
 */

// const r = new Recipe(47746);
// r.getRecipe();
// console.log(r);

const controlRecipe = async () => {
    const id = window.location.hash.replace('#', '');
    console.log(id);
    if (id) {
        // Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight selected serch 
        if (state.search) {
            searchView.highlightSelected(id);
        }

        // Create new Recipe Object
        state.recipe = new Recipe(id);
        try {
            // Get recipe data and parse ingredient
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Calculate serving and time
            state.recipe.calcTime()
            state.recipe.calcServings();

            // Render recipe
            console.log(state.recipe);
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
        } catch (error) {
            clearLoader();
            alert(error);
        }
    }
}

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * LIST CONTROLLER
 */

// window.l = new List();

const controlList = () => {
    // create a new list if there is none yet
    if (!state.list) {
        state.list = new List();
    }

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    })
}

// handle delete and update list item events
elements.shopping.addEventListener('click', el => {
    const id = el.target.closest('.shopping__item').dataset.itemid;
    console.log(id);

    // Handle the delete button
    if (el.target.matches('.shopping__delete, .shopping__delete *')) {
        //Delete from state
        state.list.deleteItem(id);

        //delete from UI
        listView.deleteItem(id);
    } else if (el.target.matches('.shopping__count-value')) {
        const val = parseFloat(el.target.value);
        state.list.updateCount(id, val);
    }
});

/**
 * LIKE CONTROLLER
 */

const controlLike = () => {
    if (!state.likes) {
        state.likes = new Likes();
    }
    const currentId = state.recipe.id;

    // Use has NOT yet liked the current recipe
    if (!state.likes.isLiked(currentId)) {
        // Add liked to the state
        const newLike = state.likes.addLike(currentId, state.recipe.title, state.recipe.author, state.recipe.img);

        // toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to UI list
        likesView.renderLike(newLike);
        // console.log(state.likes);

        // User HAS liked the current recipe
    } else {
        // Remove liked to the state
        state.likes.deleteLike(currentId);

        // toggle the like button
        likesView.toggleLikeBtn(false);

        // remove like to UI list
        likesView.deleteLike(currentId);
        // console.log(state.likes);
    }

    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

// Restoring like recipe on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    //Restore likes
    state.likes.readStorage();

    //Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => {
        likesView.renderLike(like);
    })
})

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        //Add ingredient to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLike();
    }
    // console.log(state.recipe);
});


