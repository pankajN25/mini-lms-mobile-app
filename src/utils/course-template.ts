import type { Course } from '@/types/domain.types';
import { formatPrice, formatRating } from './formatters';

export function buildCourseHtml(course: Course): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${course.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      padding: 20px;
    }
    .hero {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-block;
      background: #e0e7ff;
      color: #4f46e5;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; line-height: 1.3; }
    .meta { display: flex; gap: 16px; margin-bottom: 16px; font-size: 14px; color: #64748b; }
    .rating { color: #f59e0b; font-weight: 600; }
    .price { font-size: 22px; font-weight: 800; color: #6366f1; margin-bottom: 16px; }
    .section-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; color: #0f172a; }
    .description { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 24px; }
    .instructor {
      display: flex; align-items: center; gap: 12px;
      background: #fff; border-radius: 12px;
      padding: 14px; margin-bottom: 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .instructor img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
    .instructor-name { font-weight: 600; font-size: 15px; }
    .instructor-sub { font-size: 13px; color: #64748b; }
    .enroll-btn {
      width: 100%; background: #6366f1; color: #fff;
      border: none; border-radius: 12px;
      padding: 16px; font-size: 16px; font-weight: 700;
      cursor: pointer; margin-bottom: 12px;
    }
    .enroll-btn:active { background: #4f46e5; }
    .bookmark-btn {
      width: 100%; background: #fff; color: #6366f1;
      border: 2px solid #6366f1; border-radius: 12px;
      padding: 14px; font-size: 16px; font-weight: 700;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <img class="hero" src="${course.thumbnailUrl}" alt="${course.title}" onerror="this.style.display='none'" />
  <span class="badge">${course.category}</span>
  <h1>${course.title}</h1>
  <div class="meta">
    <span class="rating">★ ${formatRating(course.rating)}</span>
    <span>by ${course.instructor.name}</span>
  </div>
  <div class="price">${formatPrice(course.price)}</div>

  <p class="section-title">About this course</p>
  <p class="description">${course.description}</p>

  <p class="section-title">Your Instructor</p>
  <div class="instructor">
    <img src="${course.instructor.avatarUrl}" alt="${course.instructor.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor.name)}'" />
    <div>
      <div class="instructor-name">${course.instructor.name}</div>
      <div class="instructor-sub">${course.instructor.country}</div>
    </div>
  </div>

  <button class="enroll-btn" onclick="sendMessage('ENROLL_CLICKED')">Enroll Now</button>
  <button class="bookmark-btn" onclick="sendMessage('BOOKMARK_CLICKED')">Save for Later</button>

  <script>
    window.__nativeBridgeReady = false;

    function sendMessage(type) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: type,
        payload: { courseId: '${course.id}' }
      }));
    }

    window.addEventListener('nativeMessage', function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'COURSE_DATA') {
          console.log('Course data received from native');
        }
      } catch(err) {}
    });

    document.addEventListener('DOMContentLoaded', function() {
      window.__nativeBridgeReady = true;
      if (window.__pendingNativeMessages) {
        window.__pendingNativeMessages.forEach(function(raw) {
          window.dispatchEvent(new MessageEvent('nativeMessage', { data: raw }));
        });
        window.__pendingNativeMessages = [];
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CONTENT_LOADED' }));
    });
  </script>
</body>
</html>
  `.trim();
}
