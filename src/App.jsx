import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-solid';
import { ThemeSupa } from '@supabase/auth-ui-shared';

function App() {
  const [tasks, setTasks] = createSignal([]);
  const [newTask, setNewTask] = createSignal('');
  const [user, setUser] = createSignal(null);
  const [currentPage, setCurrentPage] = createSignal('login');
  const [loading, setLoading] = createSignal(false);

  const checkUserSignedIn = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setCurrentPage('homePage');
    }
  };

  onMount(checkUserSignedIn);

  createEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser(session.user);
        setCurrentPage('homePage');
      } else {
        setUser(null);
        setCurrentPage('login');
      }
    });

    return () => {
      authListener.unsubscribe();
    };
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage('login');
  };

  const fetchTasks = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await fetch('/api/getTodos', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        console.error('Error fetching tasks:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask()) return;
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await fetch('/api/saveTodo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: newTask() }),
      });
      if (response.ok) {
        const data = await response.json();
        setTasks([...tasks(), data]);
        setNewTask('');
      } else {
        console.error('Error adding task');
      }
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (id, completed) => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await fetch('/api/saveTodo', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, completed }),
      });
      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks().map(task => task.id === id ? updatedTask : task));
      } else {
        console.error('Error updating task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await fetch('/api/saveTodo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        setTasks(tasks().filter(task => task.id !== id));
      } else {
        console.error('Error deleting task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    if (!user()) return;
    fetchTasks();
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4">
      <Show
        when={currentPage() === 'homePage'}
        fallback={
          <div class="flex items-center justify-center min-h-screen">
            <div class="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
              <h2 class="text-3xl font-bold mb-6 text-center text-purple-600">Sign in with ZAPT</h2>
              <a
                href="https://www.zapt.ai"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 hover:underline mb-6 block text-center"
              >
                Learn more about ZAPT
              </a>
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={['google', 'facebook', 'apple']}
                magicLink={true}
              />
            </div>
          </div>
        }
      >
        <div class="max-w-3xl mx-auto">
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold text-purple-600">My To-Do List</h1>
            <button
              class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>

          <form onSubmit={addTask} class="flex mb-6 space-x-4">
            <input
              type="text"
              placeholder="Add New Task"
              value={newTask()}
              onInput={(e) => setNewTask(e.target.value)}
              class="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent box-border"
              required
            />
            <button
              type="submit"
              class={`px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${loading() ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading()}
            >
              {loading() ? 'Adding...' : 'Add Task'}
            </button>
          </form>

          <Show when={loading()}>
            <div class="text-center text-gray-600">Loading...</div>
          </Show>

          <ul class="space-y-4">
            <For each={tasks()}>
              {(task) => (
                <li class="flex items-center bg-white p-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id, !task.completed)}
                    class="mr-4 h-6 w-6 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span class={`flex-grow ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {task.task}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    class="text-red-500 hover:text-red-700 font-semibold focus:outline-none cursor-pointer"
                  >
                    Delete
                  </button>
                </li>
              )}
            </For>
          </ul>

        </div>
      </Show>
    </div>
  );
}

export default App;