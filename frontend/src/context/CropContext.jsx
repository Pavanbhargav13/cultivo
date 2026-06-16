// frontend/src/context/CropContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const CropContext = createContext();

const translations = {
  English: {
    // Sidebar
    dashboard: "Dashboard",
    analytics: "Analytics",
    crops_manager: "Crops Manager",
    actuator_controls: "Actuator Controls",
    system_logs: "System Logs",
    settings: "Settings",
    team_workspace: "Team Workspace",
    main_greenhouse: "Main Greenhouse",
    search_placeholder: "Search sensors...",
    greenhouse_operator: "Greenhouse Operator",
    
    // Dashboard Header & Views
    dashboard_overview: "Dashboard Overview",
    add_custom_widget: "Add Custom Widget",
    climate_telemetry_monitor: "Climate Telemetry Monitor",
    realtime_scrolling_feed: "Real-time scrolling data feed. Hover over nodes to inspect details.",
    last_7_days: "Last 7 Days",
    last_20_days: "Last 20 Days",
    last_30_days: "Last 30 Days",
    carbon_energy_offsets: "Carbon & Energy Offsets",
    active_zones_map: "Active Zones Map",
    actuator_activation_log: "Actuator Activation Log",
    latest_automated_responses: "Latest automated system responses",
    
    // Analytics
    analytics_efficiency: "Analytics & Efficiency",
    deviation_index: "Deviation Index",
    crop_stability_percent: "Crop stability percentage",
    renewable_energy_mix: "Renewable Energy Mix",
    bay_water_distribution: "Bay Water Distribution",
    main_irrigation_reservoir: "Main Irrigation Reservoir",
    air_circulation_flow: "Air Circulation Flow",
    join_our_community: "Let's join our community",
    
    // Crops Manager
    crops_threshold_manager: "Crops Threshold Manager",
    crop_profiles_title: "Cultivo Crop Profiles",
    select_crop_subtitle: "Select a crop to establish target thresholds across all automation loops.",
    active_threshold: "Active Threshold",
    apply_crop_limits: "Apply Crop Limits",
    
    // Control Console
    control_console: "Control Console",
    actuator_command_dispatch: "Actuator Command Dispatch",
    trigger_loops_subtitle: "Trigger automated decision loops or issue manual overrides.",
    dispatch_command: "Dispatch Command",
    automation_loop_mechanics: "Automation Loop Mechanics",
    incident_simulator: "n8n Incident Simulator",
    simulate_heatwave: "Simulate 38.5°C Heatwave (Critical Alert)",
    trigger_emergency_stop: "Trigger Emergency Stop (Critical System Alert)",
    
    // Audit Logs
    system_audit_logs: "System Audit Logs",
    log_audit_trail: "Log Audit Trail",
    chronological_record: "A chronological record of sensor predictions, actuator actions, and triggering causes.",
    
    // Profile Settings
    profile_preferences: "Profile & Preferences",
    edit_personal_details: "Edit Personal Details",
    operator_name: "Operator Name",
    terminal_role: "Terminal Role",
    email_address: "Email Address",
    mobile_number: "Mobile Number",
    timezone_context: "Timezone Context",
    preferred_language: "Preferred Language",
    webhook_alarm_dispatch: "Webhook Alarm Dispatch",
    save_apply_settings: "Save & Apply Settings",
    profile_updated_success: "Profile updated successfully in system context!",
    active_operator: "Active Operator",
    authorized_permission: "Authorized terminal node permission level.",

    // Landing page navbar/general
    home: "Home",
    about_us: "About Us",
    reviews: "Reviews",
    products: "Products",
    sign_in: "Sign In",
    launch_dashboard: "Launch Dashboard",
    get_started_now: "Get Started Now",
    explore_features: "Explore Features",
    
    // Hero
    hero_tag: "Top-Notch Automation Platform",
    hero_title: "Bring Fresh Growth To Agriculture.",
    hero_subtitle: "Experience the ultimate cultivation journey with real-time telemetry tracking, machine learning forecasts, and precision micro-climates tailored to your crops.",
    
    // Stats
    stat_exp: "Years of Combined Agriculture Experience",
    stat_installs: "Smart Greenhouse Installations",
    stat_profiles: "Managed Crop Profiles Worldwide",
    stat_saved: "Saved in Water & Fertilizer Waste",
    
    // Features Showcase
    features_title: "Next-Gen Solutions For Commercial Growing",
    features_subtitle: "We provide cutting-edge automation tools to maximize crop yields, optimize resource consumption, and prevent anomalies before they happen.",
    feat_irrigation_title: "Precision Irrigation",
    feat_irrigation_desc: "Smart moisture tracking triggers automated drip networks to match crop ranges exactly.",
    feat_climate_title: "Climate Optimization",
    feat_climate_desc: "Ventilation, shading, and heating adapt dynamically to solar indexes and temperature trends.",
    feat_nutrition_title: "Optimal Nutrition",
    feat_nutrition_desc: "NPK and moisture levels are continuously analyzed to feed root zones with zero nutrient waste.",
    
    // Collab banner
    collab_title: "Collaborate And Learn From Industry Experts And Enthusiasts",
    collab_subtitle: "Join a global network of smart farmers sharing optimization thresholds and sustainable techniques.",
    connect_community: "Connect With Community",
    
    // About Us section
    about_mission: "Cultivo Mission",
    about_title: "Rooted in Innovation, Growing for the Future",
    about_story_title: "Our Story",
    about_story_p1: "Cultivo was founded in Bengaluru, Karnataka, by an alliance of agricultural engineers and software architects. We recognized that climate volatility poses an escalating risk to high-yield commercial farming. Our mission is to democratize precision microclimate intelligence, giving growers granular dashboard control over localized environments.",
    about_story_p2: "By combining robust IoT telemetry loops with predictive forecasting algorithms, Cultivo helps modern growers achieve maximum yields while significantly cutting water, fertilizer, and electricity overheads.",
    about_pillars_title: "Core Pillars of Smart Growing",
    pillar1_title: "Automated Closed-Loop Interventions",
    pillar1_desc: "Continuous sensor feeds evaluate temperature, humidity, light, and moisture bounds, auto-triggering fans, vents, or irrigation.",
    pillar2_title: "LSTM Telemetry Forecasting",
    pillar2_desc: "Machine learning forecasting models project climate variables hours ahead, allowing systems to mitigate environmental stress preemptively.",
    pillar3_title: "Zero Resource Waste Philosophy",
    pillar3_desc: "By centering resource consumption around specific crop thresholds, Cultivo reduces water and microgrid power footprints by 20–30%.",
    
    // Reviews section
    reviews_testimonial: "Testimonial",
    reviews_title: "Transformative Client Experiences",
    review1_quote: "Impressed by the professionalism and attention to detail. Cultivo automated our tomato greenhouse irrigation, saving us 40% on water usage.",
    review2_quote: "A seamless experience from start to finish. The automation deviation index helped us keep humidity within a tight 2% band for our roses. Highly recommend!",
    review3_quote: "Reliable and trustworthy. Made my life so much easier! I can monitor multiple vanilla crop zones directly from my phone while in Shimoga.",
    review4_quote: "Cultivo's predictive LSTM weather model completely saved our strawberry crop during the last unexpected heatwave. Incredible engineering!"
  },
  Kannada: {
    // Sidebar
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    analytics: "ವಿಶ್ಲೇಷಣೆ",
    crops_manager: "ಬೆಳೆಗಳ ನಿರ್ವಾಹಕ",
    actuator_controls: "ನಿಯಂತ್ರಣಗಳು",
    system_logs: "ಸಿಸ್ಟಮ್ ಲಾಗ್‌ಗಳು",
    settings: "ಸಂಯೋಜನೆಗಳು",
    team_workspace: "ತಂಡದ ಕಾರ್ಯಕ್ಷೇತ್ರ",
    main_greenhouse: "ಮುಖ್ಯ ಗ್ರೀನ್‌ಹೌಸ್",
    search_placeholder: "ಸಂವೇದಕಗಳನ್ನು ಹುಡುಕಿ...",
    greenhouse_operator: "ಗ್ರೀನ್‌ಹೌಸ್ ಆಪರೇಟರ್",

    // Dashboard Header & Views
    dashboard_overview: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅವಲೋಕನ",
    add_custom_widget: "ಕಸ್ಟಮ್ ವಿಜೆಟ್ ಸೇರಿಸಿ",
    climate_telemetry_monitor: "ಹವಾಮಾನ ಟೆಲಿಮೆಟ್ರಿ ಮಾನಿಟರ್",
    realtime_scrolling_feed: "ನೈಜ-ಸಮಯದ ಡೇಟಾ ಫೀಡ್. ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ನೋಡ್‌ಗಳ ಮೇಲೆ ಸುಳಿದಾಡಿ.",
    last_7_days: "ಕಳೆದ ೭ ದಿನಗಳು",
    last_20_days: "ಕಳೆದ ೨೦ ದಿನಗಳು",
    last_30_days: "ಕಳೆದ ೩೦ ದಿನಗಳು",
    carbon_energy_offsets: "ಕಾರ್ಬನ್ ಮತ್ತು ಇಂಧನ ಆಫ್‌ಸೆಟ್‌ಗಳು",
    active_zones_map: "ಸಕ್ರಿಯ ವಲಯಗಳ ನಕ್ಷೆ",
    actuator_activation_log: "ಆಕ್ಟಿವೇಟರ್ ಕ್ರಿಯಾಶೀಲತೆಯ ಲಾಗ್",
    latest_automated_responses: "ಇತ್ತೀಚಿನ ಸ್ವಯಂಚಾಲಿತ ಸಿಸ್ಟಮ್ ಪ್ರತಿಕ್ರಿಯೆಗಳು",

    // Analytics
    analytics_efficiency: "ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ದಕ್ಷತೆ",
    deviation_index: "ವಿಚಲನ ಸೂಚ್ಯಂಕ",
    crop_stability_percent: "ಬೆಳೆ ಸ್ಥಿರತೆಯ ಶೇಕಡಾವಾರು",
    renewable_energy_mix: "ನವೀಕರಿಸಬಹುದಾದ ಇಂಧನ ಮಿಶ್ರಣ",
    bay_water_distribution: "ಕೊಲ್ಲಿ ನೀರಿನ ವಿತರಣೆ",
    main_irrigation_reservoir: "ಮುಖ್ಯ ನೀರಾವರಿ ಜಲಾಶಯ",
    air_circulation_flow: "ಗಾಳಿ ಪರಿಚಲನೆ ಹರಿವು",
    join_our_community: "ನಮ್ಮ ಸಮುದಾಯಕ್ಕೆ ಸೇರಿ",

    // Crops Manager
    crops_threshold_manager: "ಬೆಳೆಗಳ ಮಿತಿ ನಿರ್ವಾಹಕ",
    crop_profiles_title: "ಕಲ್ಟಿವೋ ಬೆಳೆ ಪ್ರೊಫೈಲ್‌ಗಳು",
    select_crop_subtitle: "ಎಲ್ಲಾ ಸ್ವಯಂಚಾಲಿತ ಲೂಪ್‌ಗಳಲ್ಲಿ ಗುರಿ ಮಿತಿಗಳನ್ನು ಸ್ಥಾಪಿಸಲು ಬೆಳೆಯನ್ನು ಆರಿಸಿ.",
    active_threshold: "ಸಕ್ರಿಯ ಮಿತಿ",
    apply_crop_limits: "ಬೆಳೆ ಮಿತಿಗಳನ್ನು ಅನ್ವಯಿಸು",

    // Control Console
    control_console: "ನಿಯಂತ್ರಣ ಕನ್ಸೋಲ್",
    actuator_command_dispatch: "ಆಕ್ಟಿವೇಟರ್ ಕಮಾಂಡ್ ಕಳುಹಿಸುವಿಕೆ",
    trigger_loops_subtitle: "ಸ್ವಯಂಚಾಲಿತ ನಿರ್ಧಾರ ಲೂಪ್‌ಗಳನ್ನು ಪ್ರಚೋದಿಸಿ ಅಥವಾ ಹಸ್ತಚಾಲಿತ ಓವರ್‌ರೈಡ್‌ಗಳನ್ನು ನೀಡಿ.",
    dispatch_command: "ಆಜ್ಞೆಯನ್ನು ಕಳುಹಿಸಿ",
    automation_loop_mechanics: "ಸ್ವಯಂಚಾಲಿತ ಲೂಪ್ ಯಂತ್ರಶಾಸ್ತ್ರ",
    incident_simulator: "n8n ಘಟನೆ ಸಿಮ್ಯುಲೇಟರ್",
    simulate_heatwave: "೩೮.೫°C ಶಾಖದ ಅಲೆ ಸಿಮ್ಯುಲೇಟ್ ಮಾಡಿ (ನಿರ್ಣಾಯಕ ಎಚ್ಚರಿಕೆ)",
    trigger_emergency_stop: "ತುರ್ತು ನಿಲುಗಡೆ ಪ್ರಚೋದಿಸಿ (ನಿರ್ಣಾಯಕ ಸಿಸ್ಟಮ್ ಎಚ್ಚರಿಕೆ)",

    // Audit Logs
    system_audit_logs: "ಸಿಸ್ಟಮ್ ಆಡಿಟ್ ಲಾಗ್‌ಗಳು",
    log_audit_trail: "ಲಾಗ್ ಆಡಿಟ್ ಟ್ರಯಲ್",
    chronological_record: "ಸಂವೇದಕ ಮುನ್ಸೂಚನೆಗಳು, ಆಕ್ಟಿವೇಟರ್ ಕ್ರಮಗಳು ಮತ್ತು ಪ್ರಚೋದಕ ಕಾರಣಗಳ ಕಾಲಾನುಕ್ರಮದ ದಾಖಲೆ.",

    // Profile Settings
    profile_preferences: "ಪ್ರೊಫೈಲ್ ಮತ್ತು ಆದ್ಯತೆಗಳು",
    edit_personal_details: "ವೈಯಕ್ತಿಕ ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ",
    operator_name: "ಆಪರೇಟರ್ ಹೆಸರು",
    terminal_role: "ಟರ್ಮಿನಲ್ ಪಾತ್ರ",
    email_address: "ಇಮೇಲ್ ವಿಳಾಸ",
    mobile_number: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    timezone_context: "ಸಮಯ ವಲಯ",
    preferred_language: "ಆದ್ಯತೆಯ ಭಾಷೆ",
    webhook_alarm_dispatch: "ವೆಬ್‌ಹೂಕ್ ಅಲಾರ್ಮ್ ರವಾನೆ",
    save_apply_settings: "ಸಂಯೋಜನೆಗಳನ್ನು ಉಳಿಸಿ ಮತ್ತು ಅನ್ವಯಿಸಿ",
    profile_updated_success: "ಸಿಸ್ಟಮ್ ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲ್ಪಟ್ಟಿದೆ!",
    active_operator: "ಸಕ್ರಿಯ ಆಪರೇಟರ್",
    authorized_permission: "ಅಧಿಕೃತ ಟರ್ಮಿನಲ್ ನೋಡ್ ಅನುಮತಿ ಮಟ್ಟ.",

    // Landing page navbar/general
    home: "ಮುಖಪುಟ",
    about_us: "ನಮ್ಮ ಬಗ್ಗೆ",
    reviews: "ವಿಮರ್ಶೆಗಳು",
    products: "ಉತ್ಪನ್ನಗಳು",
    sign_in: "ಸೈನ್ ಇನ್",
    launch_dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರಾರಂಭಿಸಿ",
    get_started_now: "ಈಗಲೇ ಪ್ರಾರಂಭಿಸಿ",
    explore_features: "ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
    
    // Hero
    hero_tag: "ಉನ್ನತ ಮಟ್ಟದ ಸ್ವಯಂಚಾಲಿತ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್",
    hero_title: "ಕೃಷಿಗೆ ಹೊಸ ಚೈತನ್ಯ ತನ್ನಿ.",
    hero_subtitle: "ನೈಜ-ಸಮಯದ ಟೆಲಿಮೆಟ್ರಿ ಟ್ರ್ಯಾಕಿಂಗ್, ಯಂತ್ರ ಕಲಿಕೆ ಮುನ್ಸೂಚನೆಗಳು ಮತ್ತು ನಿಮ್ಮ ಬೆಳೆಗಳಿಗೆ ತಕ್ಕಂತೆ ನಿಖರವಾದ ಸೂಕ್ಷ್ಮ ಹವಾಮಾನಗಳೊಂದಿಗೆ ಅತ್ಯುತ್ತಮ ಕೃಷಿ ಅನುಭವ ಪಡೆಯಿರಿ.",
    
    // Stats
    stat_exp: "ಒಟ್ಟು ಕೃಷಿ ಅನುಭವದ ವರ್ಷಗಳು",
    stat_installs: "ಸ್ಮಾರ್ಟ್ ಗ್ರೀನ್‌ಹೌಸ್ ಸ್ಥಾಪನೆಗಳು",
    stat_profiles: "ವಿಶ್ವಾದ್ಯಂತ ನಿರ್ವಹಿಸಲಾದ ಬೆಳೆ ಪ್ರೊಫೈಲ್‌ಗಳು",
    stat_saved: "ನೀರು ಮತ್ತು ರಸಗೊಬ್ಬರ ತ್ಯಾಜ್ಯದಲ್ಲಿ ಉಳಿತಾಯ",
    
    // Features Showcase
    features_title: "ವಾಣಿಜ್ಯ ಕೃಷಿಗಾಗಿ ಮುಂದಿನ ಪೀಳಿಗೆಯ ಪರಿಹಾರಗಳು",
    features_subtitle: "ಬೆಳೆ ಇಳುವರಿಯನ್ನು ಗರಿಷ್ಠಗೊಳಿಸಲು, ಸಂಪನ್ಮೂಲ ಬಳಕೆ ಉತ್ತಮಗೊಳಿಸಲು ಮತ್ತು ಹಾನಿ ತಡೆಯಲು ನಾವು ಸುಧಾರಿತ ಸ್ವಯಂಚಾಲಿತ ಪರಿಕರಗಳನ್ನು ಒದಗಿಸುತ್ತೇವೆ.",
    feat_irrigation_title: "ನಿಖರವಾದ ನೀರಾವರಿ",
    feat_irrigation_desc: "ಸ್ಮಾರ್ಟ್ ತೇವಾಂಶ ಟ್ರ್ಯಾಕಿಂಗ್ ಬೆಳೆ ಮಿತಿಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ಸ್ವಯಂಚಾಲಿತ ಹನಿ ನೀರಾವರಿ ಜಾಲವನ್ನು ಪ್ರಚೋದಿಸುತ್ತದೆ.",
    feat_climate_title: "ಹವಾಮಾನ ಆಪ್ಟಿಮೈಸೇಶನ್",
    feat_climate_desc: "ಗಾಳಿ ಪರಿಚಲನೆ, ನೆರಳು ಮತ್ತು ತಾಪನವು ಸೌರ ಸೂಚ್ಯಂಕಗಳು ಮತ್ತು ತಾಪಮಾನ ಪ್ರವೃತ್ತಿಗಳಿಗೆ ತಕ್ಕಂತೆ ಹೊಂದಿಕೊಳ್ಳುತ್ತವೆ.",
    feat_nutrition_title: "ಅತ್ಯುತ್ತಮ ಪೋಷಣೆ",
    feat_nutrition_desc: "ಬೇರು ವಲಯಗಳಿಗೆ ಶೂನ್ಯ ಪೋಷಕಾಂಶದ ತ್ಯಾಜ್ಯದೊಂದಿಗೆ ಆಹಾರ ನೀಡಲು NPK ಮತ್ತು ತೇವಾಂಶ ಮಟ್ಟವನ್ನು ನಿರಂತರವಾಗಿ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತದೆ.",
    
    // Collab banner
    collab_title: "ಉದ್ಯಮ ತಜ್ಞರು ಮತ್ತು ಉತ್ಸಾಹಿಗಳೊಂದಿಗೆ ಸಹಕರಿಸಿ ಮತ್ತು ಕಲಿಯಿರಿ",
    collab_subtitle: "ಆಪ್ಟಿಮೈಸೇಶನ್ ಮಿತಿಗಳು ಮತ್ತು ಸುಸ್ಥಿರ ತಂತ್ರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳುವ ಸ್ಮಾರ್ಟ್ ರೈತರ ಜಾಗತಿಕ ನೆಟ್‌ವರ್ಕ್ ಸೇರಿ.",
    connect_community: "ಸಮುದಾಯದೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ",
    
    // About Us section
    about_mission: "ಕಲ್ಟಿವೋ ಧ್ಯೇಯ",
    about_title: "ನಾವೀನ್ಯತೆಯಲ್ಲಿ ಬೇರೂರಿದೆ, ಭವಿಷ್ಯಕ್ಕಾಗಿ ಬೆಳೆಯುತ್ತಿದೆ",
    about_story_title: "ನಮ್ಮ ಕಥೆ",
    about_story_p1: "ಕಲ್ಟಿವೋವನ್ನು ಬೆಂಗಳೂರು, ಕರ್ನಾಟಕದಲ್ಲಿ ಕೃಷಿ ಎಂಜಿನಿಯರ್‌ಗಳು ಮತ್ತು ಸಾಫ್ಟ್‌ವೇರ್ ವಿನ್ಯಾಸಕರ ಒಕ್ಕೂಟದಿಂದ ಸ್ಥಾಪಿಸಲಾಯಿತು. ಹವಾಮಾನ ವೈಪರೀತ್ಯವು ವಾಣಿಜ್ಯ ಕೃಷಿಗೆ ಅಪಾಯವನ್ನುಂಟುಮಾಡುತ್ತದೆ ಎಂಬುದನ್ನು ನಾವು ಗುರುತಿಸಿದ್ದೇವೆ. ನಮ್ಮ ಧ್ಯೇಯವೆಂದರೆ ನಿಖರವಾದ ಹವಾಮಾನ ಬುದ್ಧಿವಂತಿಕೆಯನ್ನು ಒದಗಿಸುವುದು.",
    about_story_p2: "ಬಲವಾದ ಐಒಟಿ ಟೆಲಿಮೆಟ್ರಿ ಲೂಪ್‌ಗಳನ್ನು ಮುನ್ಸೂಚಕ ಅಲ್ಗಾರಿದಮ್‌ಗಳೊಂದಿಗೆ ಸಂಯೋಜಿಸುವ ಮೂಲಕ, ಕಲ್ಟಿವೋ ರೈತರಿಗೆ ಗರಿಷ್ಠ ಇಳುವರಿಯನ್ನು ಸಾಧಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ ಮತ್ತು ನೀರು ಮತ್ತು ವಿದ್ಯುತ್ ವೆಚ್ಚವನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.",
    about_pillars_title: "ಸ್ಮಾರ್ಟ್ ಕೃಷಿಯ ಪ್ರಮುಖ ಸ್ತಂಭಗಳು",
    pillar1_title: "ಸ್ವಯಂಚಾಲಿತ ಲೂಪ್ ಹಸ್ತಕ್ಷೇಪಗಳು",
    pillar1_desc: "ನಿರಂತರ ಸಂವೇದಕ ಫೀಡ್‌ಗಳು ತಾಪಮಾನ, ತೇವಾಂಶ, ಬೆಳಕು ಮತ್ತು ಆರ್ದ್ರತೆಯ ಮಿತಿಗಳನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡುತ್ತದೆ.",
    pillar2_title: "LSTM ಟೆಲಿಮೆಟ್ರಿ ಮುನ್ಸೂಚನೆ",
    pillar2_desc: "ಯಂತ್ರ ಕಲಿಕೆ ಮುನ್ಸೂಚನೆ ಮಾದರಿಗಳು ಹವಾಮಾನ ಪರಿಸ್ಥಿತಿಗಳನ್ನು ಮುಂಚಿತವಾಗಿ ಊಹಿಸುತ್ತವೆ.",
    pillar3_title: "ಶೂನ್ಯ ಸಂಪನ್ಮೂಲ ತ್ಯಾಜ್ಯ ತತ್ವ",
    pillar3_desc: "ನಿರ್ದಿಷ್ಟ ಬೆಳೆ ಮಿತಿಗಳ ಸುತ್ತ ಸಂಪನ್ಮೂಲ ಬಳಕೆಯನ್ನು ಕೇಂದ್ರೀಕರಿಸುವ ಮೂಲಕ, ಕಲ್ಟಿವೋ ನೀರು ಮತ್ತು ವಿದ್ಯುತ್ ಬಳಕೆಯನ್ನು 20–30% ರಷ್ಟು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.",
    
    // Reviews section
    reviews_testimonial: "ಪ್ರಶಂಸಾಪತ್ರ",
    reviews_title: "ಗ್ರಾಹಕರ ಯಶಸ್ಸಿನ ಕಥೆಗಳು",
    review1_quote: "ವೃತ್ತಿಪರತೆ ಮತ್ತು ವಿವರಗಳಿಗೆ ನೀಡಿದ ಗಮನದಿಂದ ಪ್ರಭಾವಿತನಾಗಿದ್ದೇನೆ. ಕಲ್ಟಿವೋ ನಮ್ಮ ಟೊಮೆಟೊ ಗ್ರೀನ್‌ಹೌಸ್ ನೀರಾವರಿಯನ್ನು ಸ್ವಯಂಚಾಲಿತಗೊಳಿಸಿತು, ನೀರಿನ ಬಳಕೆಯಲ್ಲಿ 40% ಉಳಿತಾಯವಾಯಿತು.",
    review2_quote: "ಮೊದಲಿನಿಂದ ಕೊನೆಯವರೆಗೆ ಸುಲಭವಾದ ಅನುಭವ. ನಮ್ಮ ಗುಲಾಬಿಗಳಿಗೆ ತೇವಾಂಶವನ್ನು ನಿಖರವಾದ ೨% ಮಿತಿಯಲ್ಲಿಡಲು ಸಹಾಯ ಮಾಡಿತು. ಖಂಡಿತವಾಗಿ ಶಿಫಾರಸು ಮಾಡುತ್ತೇನೆ!",
    review3_quote: "ವಿಶ್ವಾಸಾರ್ಹ ಮತ್ತು ನಂಬಲರ್ಹ. ನನ್ನ ಜೀವನವನ್ನು ತುಂಬಾ ಸುಲಭಗೊಳಿಸಿದೆ! ನಾನು ಶಿವಮೊಗ್ಗದಲ್ಲಿದ್ದರೂ ಫೋನ್‌ನಿಂದಲೇ ಅನೇಕ ವೆನಿಲ್ಲಾ ಬೆಳೆ ವಲಯಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಬಹುದು.",
    review4_quote: "ಕೊನೆಯ ಅನಿರೀಕ್ಷಿತ ಶಾಖದ ಅಲೆಯ ಸಮಯದಲ್ಲಿ ಕಲ್ಟಿವೋನ ಮುನ್ಸೂಚಕ ಮಾದರಿಯು ನಮ್ಮ ಸ್ಟ್ರಾಬೆರಿ ಬೆಳೆಯನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ರಕ್ಷಿಸಿತು. ಅದ್ಭುತ ತಂತ್ರಜ್ಞಾನ!"
  },
  Hindi: {
    // Sidebar
    dashboard: "डैशबोर्ड",
    analytics: "विश्लेषण",
    crops_manager: "फसल प्रबंधक",
    actuator_controls: "नियंत्रण",
    system_logs: "सिस्टम लॉग",
    settings: "सेटिंग्स",
    team_workspace: "टीम कार्यक्षेत्र",
    main_greenhouse: "मुख्य ग्रीनहाउस",
    search_placeholder: "सेंसर खोजें...",
    greenhouse_operator: "ग्रीनहाउस ऑपरेटर",

    // Dashboard Header & Views
    dashboard_overview: "डैशबोर्ड अवलोकन",
    add_custom_widget: "कस्टम विजेट जोड़ें",
    climate_telemetry_monitor: "जलवायु टेलीमेट्री मॉनिटर",
    realtime_scrolling_feed: "वास्तविक समय डेटा फ़ीड। विवरण के लिए नोड्स पर कर्सर ले जाएं।",
    last_7_days: "पिछले 7 दिन",
    last_20_days: "पिछले 20 दिन",
    last_30_days: "पिछले 30 दिन",
    carbon_energy_offsets: "कार्बन और ऊर्जा ऑफसेट",
    active_zones_map: "सक्रिय क्षेत्र मानचित्र",
    actuator_activation_log: "एक्ट्यूएटर सक्रियण लॉग",
    latest_automated_responses: "नवीनतम स्वचालित सिस्टम प्रतिक्रियाएं",

    // Analytics
    analytics_efficiency: "विश्लेषण और दक्षता",
    deviation_index: "विचलन सूचकांक",
    crop_stability_percent: "फसल स्थिरता प्रतिशत",
    renewable_energy_mix: "नवीकरणीय ऊर्जा मिश्रण",
    bay_water_distribution: "बे पानी वितरण",
    main_irrigation_reservoir: "मुख्य सिंचाई जलाशय",
    air_circulation_flow: "वायु परिसंचरण प्रवाह",
    join_our_community: "हमारे समुदाय में शामिल हों",

    // Crops Manager
    crops_threshold_manager: "फसल सीमा प्रबंधक",
    crop_profiles_title: "कल्टीवो फसल प्रोफाइल",
    select_crop_subtitle: "स्वचालित लूप में लक्ष्य सीमाएं स्थापित करने के लिए फसल चुनें।",
    active_threshold: "सक्रिय सीमा",
    apply_crop_limits: "फसल सीमा लागू करें",

    // Control Console
    control_console: "नियंत्रण कंसोल",
    actuator_command_dispatch: "एक्ट्यूएटर कमांड प्रेषण",
    trigger_loops_subtitle: "स्वचालित निर्णय लूप को ट्रिगर करें या मैन्युअल ओवरराइड जारी करें।",
    dispatch_command: "कमांड भेजें",
    automation_loop_mechanics: "स्वचालन लूप यांत्रिकी",
    incident_simulator: "n8n घटना सिम्युलेटर",
    simulate_heatwave: "38.5°C हीटवेव का अनुकरण करें (महत्वपूर्ण चेतावनी)",
    trigger_emergency_stop: "इमरजेंसी स्टॉप ट्रिगर करें (महत्वपूर्ण सिस्टम चेतावनी)",

    // Audit Logs
    system_audit_logs: "सिस्टम ऑडिट लॉग",
    log_audit_trail: "लॉग ऑडिट ट्रेल",
    chronological_record: "सेंसर भविष्यवाणियों, एक्ट्यूएटर कार्यों और ट्रिगर कारणों का कालानुक्रमिक रिकॉर्ड।",

    // Profile Settings
    profile_preferences: "प्रोफ़ाइल और प्राथमिकताएं",
    edit_personal_details: "व्यक्तिगत विवरण संपादित करें",
    operator_name: "ऑपरेटर का नाम",
    terminal_role: "टर्मिनल भूमिका",
    email_address: "ईमेल पता",
    mobile_number: "मोबाइल नंबर",
    timezone_context: "समय क्षेत्र संदर्भ",
    preferred_language: "पसंदीदा भाषा",
    webhook_alarm_dispatch: "वेबहुक अलार्म प्रेषण",
    save_apply_settings: "सेटिंग्स सहेजें और लागू करें",
    profile_updated_success: "सिस्टम संदर्भ में प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!",
    active_operator: "सक्रिय ऑपरेटर",
    authorized_permission: "अधिकृत टर्मिनल नोड अनुमति स्तर।",

    // Landing page navbar/general
    home: "मुख्यपृष्ठ",
    about_us: "हमारे बारे में",
    reviews: "समीक्षाएं",
    products: "उत्पाद",
    sign_in: "साइन इन",
    launch_dashboard: "डैशबोर्ड शुरू करें",
    get_started_now: "अभी शुरू करें",
    explore_features: "विशेषताओं का अन्वेषण करें",
    
    // Hero
    hero_tag: "सर्वप्रथम स्वचालन मंच",
    hero_title: "कृषि में नया विकास लाएं।",
    hero_subtitle: "वास्तविक समय टेलीमेट्री ट्रैकिंग, मशीन लर्निंग पूर्वानुमान और अपनी फसलों के लिए अनुकूलित सूक्ष्म जलवायु के साथ अंतिम कृषि यात्रा का अनुभव करें।",
    
    // Stats
    stat_exp: "संयुक्त कृषि अनुभव के वर्ष",
    stat_installs: "स्मार्ट ग्रीनहाउस स्थापनाएं",
    stat_profiles: "दुनिया भर में प्रबंधित फसल प्रोफाइल",
    stat_saved: "पानी और उर्वरक कचरे में बचत",
    
    // Features Showcase
    features_title: "व्यावसायिक खेती के लिए अगली पीढ़ी के समाधान",
    features_subtitle: "हम फसल की पैदावार बढ़ाने, संसाधन खपत को अनुकूलित करने और विसंगतियों को रोकने के लिए उन्नत स्वचालन उपकरण प्रदान करते हैं।",
    feat_irrigation_title: "सटीक सिंचाई",
    feat_irrigation_desc: "स्मार्ट नमी ट्रैकिंग फसल सीमाओं से मेल खाने के लिए स्वचालित ड्रिप नेटवर्क को ट्रिगर करती है।",
    feat_climate_title: "जलवायु अनुकूलन",
    feat_climate_desc: "हवा परिसंचरण, छायांकन और हीटिंग सौर सूचकांकों और तापमान रुझानों के अनुसार स्वचालित रूप से अनुकूलित होते हैं।",
    feat_nutrition_title: "सर्वोत्तम पोषण",
    feat_nutrition_desc: "जड़ों को शून्य पोषक तत्व बर्बादी के साथ खिलाने के लिए एनपीके और नमी के स्तर का लगातार विश्लेषण किया जाता है।",
    
    // Collab banner
    collab_title: "उद्योग विशेषज्ञों और उत्साही लोगों के साथ सहयोग करें और सीखें",
    collab_subtitle: "अनुकूलन सीमाओं और टिकाऊ तकनीकों को साझा करने वाले स्मार्ट किसानों के वैश्विक नेटवर्क में शामिल हों।",
    connect_community: "समुदाय से जुड़ें",
    
    // About Us section
    about_mission: "कल्टीवो मिशन",
    about_title: "नवाचार में निहित, भविष्य के लिए बढ़ रहा है",
    about_story_title: "हमारी कहानी",
    about_story_p1: "कल्टीवो की स्थापना बेंगलुरु, कर्नाटक में कृषि इंजीनियरों और सॉफ्टवेयर डिजाइनरों के एक गठबंधन द्वारा की गई थी। हमने पहचाना कि जलवायु अनिश्चितता व्यावसायिक खेती के लिए एक बड़ा खतरा है। हमारा मिशन सटीक जलवायु बुद्धिमत्ता प्रदान करना है।",
    about_story_p2: "मजबूत आईओटी टेलीमेट्री लूप को भविष्य कहनेवाला एल्गोरिदम के साथ जोड़कर, कल्टीवो किसानों को अधिकतम पैदावार हासिल करने और पानी व बिजली की लागत को कम करने में मदद करता है।",
    about_pillars_title: "स्मार्ट खेती के मुख्य स्तंभ",
    pillar1_title: "स्वचालित बंद लूप हस्तक्षेप",
    pillar1_desc: "निरंतर सेंसर फीड तापमान, आर्द्रता, प्रकाश और नमी की सीमा का मूल्यांकन करते हैं, और स्वचालित रूप से वेंटिलेशन या सिंचाई ट्रिगर करते हैं।",
    pillar2_title: "LSTM टेलीमेट्री पूर्वानुमान",
    pillar2_desc: "मशीन लर्निंग पूर्वानुमान मॉडल मौसम की स्थिति का पहले से अनुमान लगाते हैं।",
    pillar3_title: "शून्य संसाधन अपशिष्ट दर्शन",
    pillar3_desc: "विशिष्ट फसल सीमाओं के आसपास संसाधन खपत को केंद्रित करके, कल्टीवो पानी और बिजली की खपत को 20-30% तक कम कर देता है।",
    
    // Reviews section
    reviews_testimonial: "प्रशंसापत्र",
    reviews_title: "ग्राहकों के अनुभव",
    review1_quote: "पेशेवर रवैये और बारीकियों पर दिए गए ध्यान से बहुत प्रभावित हूं। कल्टीवो ने हमारे टमाटर ग्रीनहाउस सिंचाई को स्वचालित कर दिया, जिससे 40% पानी बचा।",
    review2_quote: "शुरुआत से अंत तक एक बहुत ही सहज अनुभव। हमारे गुलाब के लिए आर्द्रता को 2% की तंग सीमा में रखने में मदद की। अत्यधिक अनुशंसित!",
    review3_quote: "विश्वसनीय और भरोसेमंद। मेरे जीवन को बहुत आसान बना दिया! मैं शिमोगा में रहते हुए भी अपने फोन से कई वैनिला फसल क्षेत्रों की निगरानी कर सकता हूं।",
    review4_quote: "अचानक आई हीटवेव के दौरान कल्टीवो के पूर्वानुमान मॉडल ने हमारी स्ट्रॉबेरी की फसल को पूरी तरह से बचा लिया। अद्भुत इंजीनियरिंग!"
  }
};


export const CropProvider = ({ children }) => {
  const [activeView, setActiveView] = useState('landing'); // 'landing' or 'dashboard'
  const [subView, setSubView] = useState('dashboard'); // 'dashboard', 'analytics', 'crops', 'controls', 'logs'
  const [selectedCrop, setSelectedCrop] = useState('');
  const [logDays, setLogDays] = useState(30);
  const [cropsData, setCropsData] = useState([]);
  const [liveLogs, setLiveLogs] = useState([]);
  const [operator, setOperator] = useState({
    name: "Alex Williamson",
    role: "Greenhouse Operator",
    email: "alex.williamson@cultivo.io",
    phone: "+91 98765 43210",
    timezone: "IST (UTC+5:30)",
    language: "English",
    notifications: true
  });
  
  // Sync active crop context with backend API
  useEffect(() => {
    if (selectedCrop) {
      fetch(`http://localhost:8000/crops/${selectedCrop}/active`, { method: 'POST' })
        .then((res) => res.json())
        .then((data) => console.log("Synced active crop with backend:", data))
        .catch((err) => console.error("Error syncing active crop:", err));
    }
  }, [selectedCrop]);
  
  // Fetch crops metadata on load
  useEffect(() => {
    fetch('http://localhost:8000/crops')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(async (names) => {
        const fullCrops = await Promise.all(
          names.map((name) =>
            fetch(`http://localhost:8000/crops/${name}`).then((r) => r.json())
          )
        );
        setCropsData(fullCrops);
        if (fullCrops.length > 0) {
          setSelectedCrop(fullCrops[0].name); // select first crop by default
        }
      })
      .catch((err) => {
        console.error("Failed to load crops, using fallback local mock.", err);
        // Fallback mock data in case backend is offline
        const mockCrops = [
          {
            name: "Tomato",
            category: "vegetable",
            ranges: {
              temperature: { min: 22, max: 27 },
              humidity: { min: 60, max: 80 },
              light: { min: 500, max: 1200 },
              co2: { min: 400, max: 800 },
              nutrition: { min: 12, max: 18 }
            }
          },
          {
            name: "Lettuce",
            category: "vegetable",
            ranges: {
              temperature: { min: 15, max: 20 },
              humidity: { min: 70, max: 85 },
              light: { min: 300, max: 800 },
              co2: { min: 350, max: 700 },
              nutrition: { min: 10, max: 15 }
            }
          },
          {
            name: "Strawberry",
            category: "fruit",
            ranges: {
              temperature: { min: 18, max: 22 },
              humidity: { min: 65, max: 80 },
              light: { min: 400, max: 900 },
              co2: { min: 350, max: 750 },
              nutrition: { min: 11, max: 16 }
            }
          },
          {
            name: "DragonFruit",
            category: "fruit",
            ranges: {
              temperature: { min: 24, max: 30 },
              humidity: { min: 55, max: 70 },
              light: { min: 700, max: 1500 },
              co2: { min: 400, max: 900 },
              nutrition: { min: 13, max: 19 }
            }
          },
          {
            name: "Mushroom",
            category: "fungi",
            ranges: {
              temperature: { min: 16, max: 22 },
              humidity: { min: 85, max: 95 },
              light: { min: 0, max: 200 },
              co2: { min: 500, max: 1200 },
              nutrition: { min: 8, max: 12 }
            }
          }
        ];
        setCropsData(mockCrops);
        setSelectedCrop(mockCrops[0].name);
      });
  }, []);

  // Fetch initial logs and then simulate a live stream of sensor values
  useEffect(() => {
    const fetchInitialLogs = () => {
      fetch(`http://localhost:8000/logs/actuators?days=${logDays}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            setLiveLogs(data.reverse());
          } else {
            generateDummyInitialLogs();
          }
        })
        .catch(() => {
          generateDummyInitialLogs();
        });
    };

    const generateDummyInitialLogs = () => {
      // Create some initial dummy history points spanning the last 24 hours
      const dummy = [];
      const now = new Date();
      const sensors = ['temperature', 'humidity', 'co2', 'soil_moisture'];
      
      for (let i = 20; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 1000 * 30);
        sensors.forEach((sensor) => {
          const val = getRandomValueForSensor(sensor);
          dummy.push({
            id: `init-${i}-${sensor}`,
            timestamp: time.toISOString(),
            action: getMockAction(sensor, val),
            sensor_type: sensor,
            predicted_value: val,
            actual_value: val - 0.5,
            power_consumption: Math.random() > 0.5 ? 20 + Math.random()*20 : 0,
            cause: val > 27 ? "Threshold exceeded" : "Routine reading",
            crop_name: selectedCrop || "Tomato"
          });
        });
      }
      setLiveLogs(dummy);
    };

    fetchInitialLogs();
  }, [logDays, selectedCrop]);

  // Periodic live updates (simulation of telemetry data coming from the greenhouse sensor grid)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const sensors = ['temperature', 'humidity', 'co2', 'soil_moisture'];
      
      const newReadings = sensors.map((sensor) => {
        const val = getRandomValueForSensor(sensor);
        return {
          id: `live-${Date.now()}-${sensor}`,
          timestamp: now.toISOString(),
          action: getMockAction(sensor, val),
          sensor_type: sensor,
          predicted_value: val,
          actual_value: val - 0.2,
          power_consumption: Math.random() > 0.7 ? 15 + Math.random()*30 : 0,
          cause: "Live telemetry",
          crop_name: selectedCrop || "Tomato"
        };
      });

      setLiveLogs((prev) => {
        const combined = [...prev, ...newReadings];
        // Limit history to 150 points for performance
        if (combined.length > 150) {
          return combined.slice(combined.length - 150);
        }
        return combined;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedCrop]);

  const getRandomValueForSensor = (type) => {
    const currentCropObj = cropsData.find(c => c.name === selectedCrop);
    const ranges = currentCropObj?.ranges || {
      temperature: { min: 20, max: 28 },
      humidity: { min: 60, max: 80 },
      co2: { min: 400, max: 800 },
      soil_moisture: { min: 30, max: 70 }
    };

    const target = ranges[type === 'soil_moisture' ? 'nutrition' : type] || { min: 10, max: 50 };
    const buffer = (target.max - target.min) * 0.25;
    // Occasionally trigger anomalies / out of range readings
    const isAnomaly = Math.random() > 0.85;
    if (isAnomaly) {
      return Math.random() > 0.5 ? target.max + buffer * 1.5 : target.min - buffer * 1.5;
    }
    return target.min + Math.random() * (target.max - target.min);
  };

  const getMockAction = (sensor, val) => {
    const currentCropObj = cropsData.find(c => c.name === selectedCrop);
    const max = currentCropObj?.ranges?.[sensor === 'soil_moisture' ? 'nutrition' : sensor]?.max || 100;
    
    if (val > max) {
      if (sensor === 'temperature') return 'fan_on';
      if (sensor === 'humidity') return 'vent_open';
      if (sensor === 'soil_moisture') return 'irrigate';
      if (sensor === 'co2') return 'vent_open';
    }
    return 'none';
  };

  const t = (key) => {
    const lang = operator.language || 'English';
    const dict = translations[lang] || translations['English'];
    return dict[key] || key;
  };

  return (
    <CropContext.Provider value={{
      activeView,
      setActiveView,
      subView,
      setSubView,
      selectedCrop,
      setSelectedCrop,
      logDays,
      setLogDays,
      cropsData,
      liveLogs,
      setLiveLogs,
      operator,
      setOperator,
      t
    }}>
      {children}
    </CropContext.Provider>
  );
};

export const useCrop = () => useContext(CropContext);
