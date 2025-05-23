package com.example.userservice.config;


import com.example.userservice.util.JwtRequestFilter;
import com.example.userservice.service.CustomOAuth2UserService;  // Import CustomOAuth2UserService
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2LoginAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.boot.actuate.autoconfigure.security.servlet.EndpointRequest;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JwtRequestFilter jwtRequestFilter;
    private final CustomOAuth2UserService customOAuth2UserService; // Add custom OAuth2 service
    //private final InternalAuthFilter internalAuthFilter;

    public SecurityConfig(UserDetailsService userDetailsService, JwtRequestFilter jwtRequestFilter, CustomOAuth2UserService customOAuth2UserService) {
        this.userDetailsService = userDetailsService;
        this.jwtRequestFilter = jwtRequestFilter;
        this.customOAuth2UserService = customOAuth2UserService;
        //this.internalAuthFilter = internalAuthFilter;// Inject the custom OAuth2 service
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder authenticationManagerBuilder =
                http.getSharedObject(AuthenticationManagerBuilder.class);
        authenticationManagerBuilder
                .userDetailsService(userDetailsService)
                .passwordEncoder(passwordEncoder());
        return authenticationManagerBuilder.build();
    }

    /*@Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors().configurationSource(corsConfigurationSource())
                .and()
                .csrf().disable()

                // Set stateless session management for JWT
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()

                .authorizeRequests()
                .requestMatchers(EndpointRequest.to(HealthEndpoint.class)).permitAll()
                .requestMatchers("/api/users/register", "/api/users/login", "/oauth2/**", "/actuator/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/*").permitAll()
                .anyRequest().authenticated()
                .and()

                .oauth2Login()
                //.loginPage("/login") // Make sure this is commented or removed
                .userInfoEndpoint()
                .userService(customOAuth2UserService)
                .and()
                .and()

                // Disable default form login to avoid redirect on unauthorized
                .formLogin().disable()

                // Optional: disable HTTP Basic if you don’t want it
                //.httpBasic().disable()

                .exceptionHandling()
                .authenticationEntryPoint((request, response, authException) -> {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                })
                .and()

                // Add your JWT filter before UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }*/
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors().configurationSource(corsConfigurationSource())
                .and()
                .csrf().disable()
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .authorizeRequests()
                .requestMatchers(EndpointRequest.to(HealthEndpoint.class)).permitAll()
                .requestMatchers(
                        "/api/users/register",
                        "/api/users/login",
                        "/actuator/health/**",
                        "/oauth2/**"
                ).permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/*").permitAll()
                .anyRequest().authenticated()
                .and()
                .oauth2Login()
                .userInfoEndpoint()
                .userService(customOAuth2UserService)
                .and()
                .and()
                .exceptionHandling()
                .defaultAuthenticationEntryPointFor(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                        new AntPathRequestMatcher("/actuator/**")
                )
                .and()
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    /*public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        *//*http
                .cors().configurationSource(corsConfigurationSource())  // Updated CORS configuration
                .and().csrf().disable()  // Disable CSRF as it’s not needed for stateless authentication
                .authorizeRequests()
                .requestMatchers(EndpointRequest.to(HealthEndpoint.class)).permitAll()
                .requestMatchers("/login").permitAll()
                .requestMatchers("/api/users/login", "/api/users/register", "/oauth2/**", "/api/users/google-login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/**").permitAll()// Allow Google OAuth and other public endpoints
                .anyRequest().authenticated()  // Any other request requires authentication
                .and()
                .oauth2Login() // Enable OAuth2 login (Google login)
                //.loginPage("/login") // Customize login page if needed
                .redirectionEndpoint()
                .baseUri("http://user.local/login/oauth2/code/google")// Set custom redirect URI
                .and()
                .userInfoEndpoint()
                .userService(customOAuth2UserService) // Use the custom OAuth2 user service for processing OAuth2 login
                .and()
                .and()
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
                 // Add JWT filter for custom login

        return http.build();*//*
        http
                .cors().configurationSource(corsConfigurationSource())
                .and()
                .csrf().disable()
                .authorizeRequests()
                .requestMatchers(EndpointRequest.to(HealthEndpoint.class)).permitAll()
                .requestMatchers("/api/users/register", "/api/users/login", "/oauth2/**").permitAll()
                //.requestMatchers("/login").permitAll()  // Remove this if no web login form
                .anyRequest().authenticated()
                .and()
                .oauth2Login()
                // .loginPage("/login")  // <--- COMMENT OUT or REMOVE this line
                .userInfoEndpoint()
                .userService(customOAuth2UserService)
                .and()
                .and()
                .exceptionHandling()
                .authenticationEntryPoint((request, response, authException) -> {
                    // Return 401 for unauthorized REST requests instead of redirect
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                })
                .and()
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }*/

    // CORS Configuration Source Bean
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000")); // Replace with your frontend's URL
        configuration.setAllowedOrigins(List.of("https://taskmanager.com:30443"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
