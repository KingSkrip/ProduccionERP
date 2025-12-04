import { Injectable, inject } from '@angular/core';
import { FuseNavigationItem } from '@fuse/components/navigation/navigation.types';
import { RoleEnum } from 'app/core/auth/roles/dataroles';
import { menuAdmin, menuRh } from 'app/mock-api/common/navigation/data';
import { BehaviorSubject, Observable, ReplaySubject, tap  } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { Navigation } from 'app/core/navigation/navigation.types';


@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _componentRegistry: Map<string, any> = new Map<string, any>();
    private _httpClient = inject(HttpClient);
    private _navigation: ReplaySubject<Navigation> =
        new ReplaySubject<Navigation>(1);
    private _navigationStore: Map<string, FuseNavigationItem[]> = new Map<
        string,
        any
    >();
    
    // NUEVO: Subject para emitir cambios en la navegación
    private _navigationChanged$ = new BehaviorSubject<{ key: string, navigation: FuseNavigationItem[] } | null>(null);
    
    /**
     * Observable para suscribirse a cambios en la navegación
     */
    get navigationChanged$(): Observable<{ key: string, navigation: FuseNavigationItem[] } | null> {
        return this._navigationChanged$.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register navigation component
     *
     * @param name
     * @param component
     */
    registerComponent(name: string, component: any): void {
        this._componentRegistry.set(name, component);
    }

    /**
     * Deregister navigation component
     *
     * @param name
     */
    deregisterComponent(name: string): void {
        this._componentRegistry.delete(name);
    }

    /**
     * Get navigation component from the registry
     *
     * @param name
     */
    getComponent<T>(name: string): T {
        return this._componentRegistry.get(name);
    }

    /**
     * Store the given navigation with the given key
     *
     * @param key
     * @param navigation
     */
    storeNavigation(key: string, navigation: FuseNavigationItem[]): void {
        console.log('📦 Almacenando navegación con key:', key, navigation);
        // Add to the store
        this._navigationStore.set(key, navigation);
        
        // NUEVO: Emitir el cambio
        this._navigationChanged$.next({ key, navigation });
    }

    /**
     * Get navigation from storage by key
     *
     * @param key
     */
    getNavigation(key: string): FuseNavigationItem[] {
        const nav = this._navigationStore.get(key) ?? [];
        console.log('🔍 Obteniendo navegación con key:', key, nav);
        return nav;
    }

    /**
     * Delete the navigation from the storage
     *
     * @param key
     */
    deleteNavigation(key: string): void {
        // Check if the navigation exists
        if (!this._navigationStore.has(key)) {
            console.warn(
                `Navigation with the key '${key}' does not exist in the store.`
            );
        }

        // Delete from the storage
        this._navigationStore.delete(key);
        
        // Emitir cambio
        this._navigationChanged$.next({ key, navigation: [] });
    }

    /**
     * Utility function that returns a flattened
     * version of the given navigation array
     *
     * @param navigation
     * @param flatNavigation
     */
    getFlatNavigation(
        navigation: FuseNavigationItem[],
        flatNavigation: FuseNavigationItem[] = []
    ): FuseNavigationItem[] {
        for (const item of navigation) {
            if (item.type === 'basic') {
                flatNavigation.push(item);
                continue;
            }

            if (
                item.type === 'aside' ||
                item.type === 'collapsable' ||
                item.type === 'group'
            ) {
                if (item.children) {
                    this.getFlatNavigation(item.children, flatNavigation);
                }
            }
        }

        return flatNavigation;
    }

    /**
     * Utility function that returns the item
     * with the given id from given navigation
     *
     * @param id
     * @param navigation
     */
    getItem(
        id: string,
        navigation: FuseNavigationItem[]
    ): FuseNavigationItem | null {
        for (const item of navigation) {
            if (item.id === id) {
                return item;
            }

            if (item.children) {
                const childItem = this.getItem(id, item.children);

                if (childItem) {
                    return childItem;
                }
            }
        }

        return null;
    }

    /**
     * Utility function that returns the item's parent
     * with the given id from given navigation
     *
     * @param id
     * @param navigation
     * @param parent
     */
    getItemParent(
        id: string,
        navigation: FuseNavigationItem[],
        parent: FuseNavigationItem[] | FuseNavigationItem
    ): FuseNavigationItem[] | FuseNavigationItem | null {
        for (const item of navigation) {
            if (item.id === id) {
                return parent;
            }

            if (item.children) {
                const childItem = this.getItemParent(id, item.children, item);

                if (childItem) {
                    return childItem;
                }
            }
        }

        return null;
    }

    getNavigationByRole(roleId: number): FuseNavigationItem[] {
        let navigation: FuseNavigationItem[];

        switch (roleId) {
            case RoleEnum.RH:
                console.log("🎯 Cargando menú RH");
                navigation = menuRh;
                break;
            case RoleEnum.SUADMIN:
                console.log("🎯 Cargando menú ADMIN");
                navigation = menuAdmin;
                break;
            default:
                console.warn("⚠️ Rol no reconocido:", roleId);
                navigation = [];
                break;
        }

        // CRÍTICO: Triple verificación de que sea un array válido
        if (!navigation) {
            console.error("❌ Navigation es null/undefined para roleId:", roleId);
            return [];
        }

        if (!Array.isArray(navigation)) {
            console.error("❌ Navigation no es un array para roleId:", roleId, navigation);
            return [];
        }

        // Crear una copia para evitar mutaciones
        return [...navigation];
    }
    

    /**
     * Get all navigation data
     */
    get(): Observable<Navigation> {
        return this._httpClient.get<Navigation>('api/common/navigation').pipe(
            tap((navigation) => {
                this._navigation.next(navigation);
            })
        );
    }

     /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation> {
        return this._navigation.asObservable();
    }
}