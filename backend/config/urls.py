from django.urls import path
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from route import customer, provider, admin

@api_view(['GET'])
@permission_classes([AllowAny])
def home_view(request):
    return JsonResponse({
        "success": True,
        "message": "Local Service Booking Backend V3 Running",
        "version": "3.0"
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def health_view(request):
    return JsonResponse({"status": "OK"}, status=200)

# Plain Dispatchers for endpoints supporting multiple methods across views
def customer_profile_dispatch(request, *args, **kwargs):
    if request.method == 'PUT':
        return customer.update_customer_profile(request, *args, **kwargs)
    return customer.get_customer_profile(request, *args, **kwargs)

def provider_profile_dispatch(request, *args, **kwargs):
    if request.method == 'PUT':
        return provider.update_provider_profile(request, *args, **kwargs)
    return provider.get_provider_profile(request, *args, **kwargs)

def service_provider_dispatch(request, *args, **kwargs):
    if request.method == 'POST':
        return provider.link_service(request, *args, **kwargs)
    return provider.list_linked_services(request, *args, **kwargs)

def category_dispatch(request, *args, **kwargs):
    if request.method == 'POST':
        return admin.create_category(request, *args, **kwargs)
    return customer.list_categories(request, *args, **kwargs)

def category_detail_dispatch(request, category_id, *args, **kwargs):
    if request.method == 'DELETE':
        return admin.delete_category(request, category_id, *args, **kwargs)
    return admin.update_category(request, category_id, *args, **kwargs)

def service_dispatch(request, *args, **kwargs):
    if request.method == 'POST':
        return admin.create_service(request, *args, **kwargs)
    return customer.list_services(request, *args, **kwargs)

def service_detail_dispatch(request, service_id, *args, **kwargs):
    if request.method == 'DELETE':
        return admin.delete_service(request, service_id, *args, **kwargs)
    return admin.update_service(request, service_id, *args, **kwargs)

def admin_provider_detail_dispatch(request, provider_id, *args, **kwargs):
    if request.method == 'PUT':
        return admin.admin_update_provider(request, provider_id, *args, **kwargs)
    elif request.method == 'DELETE':
        return admin.admin_delete_provider(request, provider_id, *args, **kwargs)
    return admin.admin_get_provider(request, provider_id, *args, **kwargs)

def admin_customer_detail_dispatch(request, customer_id, *args, **kwargs):
    if request.method == 'PUT':
        return admin.admin_update_customer(request, customer_id, *args, **kwargs)
    elif request.method == 'DELETE':
        return admin.admin_delete_customer(request, customer_id, *args, **kwargs)
    return admin.admin_get_customer(request, customer_id, *args, **kwargs)

urlpatterns = [
    # General
    path('', home_view),
    path('health', health_view),

    # Customer Auth & Profile
    path('api/customer/register', customer.register_customer),
    path('api/customer/verify-email', customer.verify_customer_email),
    path('api/customer/login', customer.login_customer),
    path('api/customer/forgot-password', customer.customer_forgot_password),
    path('api/customer/verify-otp', customer.customer_verify_otp),
    path('api/customer/reset-password', customer.customer_reset_password),
    path('api/customer/refresh-token', customer.customer_refresh_token),
    path('api/customer/logout', customer.customer_logout),
    path('api/customer/profile', customer_profile_dispatch),

    # Customer Categories & Services & Booking
    path('api/category', category_dispatch),
    path('api/service', service_dispatch),
    path('api/booking', customer.create_booking),
    path('api/customer/service-completed/<int:booking_id>', customer.mark_service_completed),
    path('api/customer/cancel-booking/<int:booking_id>', customer.customer_cancel_booking_from_email),
    path('completed', customer.service_completed_success_page),
    path('api/booking/history', customer.get_customer_booking_history),
    path('api/booking/<int:booking_id>/cancel', customer.cancel_booking),
    path('api/booking/customer/<int:booking_id>/complete', customer.customer_complete_booking),
    path('api/review', customer.create_review),
    path('api/review/public/<int:booking_id>', customer.public_review),
    path('api/customer/review/<int:booking_id>', customer.customer_review_page),
    path('api/review/provider/<int:provider_id>', customer.get_provider_reviews),
    path('api/payment/create', customer.create_payment),
    path('api/payment/<int:booking_id>/status', customer.get_payment_status),
    path('api/payment/history', customer.get_payment_history),
    path('api/notification', customer.list_notifications),
    path('api/notification/<int:notification_id>/read', customer.mark_notification_read),
    path('api/provider', customer.customer_list_providers),
    path('api/provider/<int:provider_id>', customer.customer_get_provider_details),

    # Provider Auth & Operations
    path('api/provider/register', provider.register_provider),
    path('api/provider/verify-email', provider.verify_provider_email),
    path('api/provider/login', provider.login_provider),
    path('api/provider/forgot-password', provider.provider_forgot_password),
    path('api/provider/verify-otp', provider.provider_verify_otp),
    path('api/provider/reset-password', provider.provider_reset_password),
    path('api/provider/refresh-token', provider.provider_refresh_token),
    path('api/provider/logout', provider.provider_logout),
    path('api/provider/profile', provider_profile_dispatch),
    path('api/provider/documents', provider.upload_document),
    path('api/service/provider', service_provider_dispatch),
    path('api/service/provider/<int:service_id>', provider.unlink_service),
    path('api/booking/provider/history', provider.get_provider_booking_history),
    path('api/booking/provider/<int:booking_id>/accept', provider.accept_booking),
    path('api/booking/provider/<int:booking_id>/reject', provider.reject_booking),
    path('api/booking/provider/<int:booking_id>/start', provider.start_booking),
    path('api/booking/provider/<int:booking_id>/complete', provider.complete_booking),
    path('api/booking/provider/<int:booking_id>/cancel', provider.provider_cancel_booking),
    path('api/review/<int:review_id>/reply', provider.reply_to_review),

    # Admin Operations
    path('api/admin/login', admin.login_admin),
    path('api/admin/provider/<int:provider_id>/approve', admin.approve_provider),
    path('api/admin/provider/<int:provider_id>/reject', admin.reject_provider),
    path('api/admin/provider/<int:provider_id>/suspend', admin.suspend_provider),
    path('api/admin/customer/<int:customer_id>/suspend', admin.suspend_customer),
    path('api/admin/stats', admin.get_dashboard_stats),
    path('api/admin/dashboard', admin.get_dashboard_stats),
    path('api/admin/dashboard/recent', admin.get_dashboard_recent),
    path('api/admin/reports/export', admin.export_reports),
    path('api/admin/reports', admin.get_aggregate_reports),
    path('api/admin/activity-logs', admin.get_activity_logs),
    path('api/category/<int:category_id>', category_detail_dispatch),
    path('api/service/<int:service_id>', service_detail_dispatch),
    path('api/payment/<int:booking_id>/refund', admin.refund_payment),
    path('api/admin/providers', admin.admin_list_providers),
    path('api/admin/provider-approval', admin.admin_provider_approval_list),
    path('api/admin/provider/<int:provider_id>', admin_provider_detail_dispatch),
    path('api/admin/provider/<int:provider_id>/block', admin.block_provider),
    path('api/admin/provider/<int:provider_id>/unblock', admin.unblock_provider),
    path('api/admin/customers', admin.admin_list_customers),
    path('api/admin/customer/<int:customer_id>', admin_customer_detail_dispatch),
    path('api/admin/customer/<int:customer_id>/unblock', admin.unblock_customer),
    path('api/admin/categories', admin.admin_list_categories),
    path('api/admin/services', admin.admin_list_services),
    path('api/admin/bookings', admin.admin_list_bookings),
    path('api/admin/reviews', admin.admin_list_reviews),
    path('api/admin/booking/<int:booking_id>/cancel', admin.admin_cancel_booking),
    path('api/admin/review/<int:review_id>', admin.admin_delete_review),
]
